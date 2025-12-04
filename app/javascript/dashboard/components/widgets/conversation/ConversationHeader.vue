<script setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { useElementSize } from '@vueuse/core';
import { useAlert } from 'dashboard/composables';
import BackButton from '../BackButton.vue';
import InboxName from '../InboxName.vue';
import MoreActions from './MoreActions.vue';
import Avatar from 'next/avatar/Avatar.vue';
import SLACardLabel from './components/SLACardLabel.vue';
import wootConstants from 'dashboard/constants/globals';
import { conversationListPageURL } from 'dashboard/helper/URLHelper';
import { snoozedReopenTime } from 'dashboard/helper/snoozeHelpers';
import { useInbox } from 'dashboard/composables/useInbox';
import { useI18n } from 'vue-i18n';
import ButtonV4 from 'dashboard/components-next/button/Button.vue';
import Modal from 'dashboard/components/Modal.vue';

const props = defineProps({
  chat: {
    type: Object,
    default: () => ({}),
  },
  showBackButton: {
    type: Boolean,
    default: false,
  },
});

const { t } = useI18n();
const store = useStore();
const route = useRoute();
const conversationHeader = ref(null);
const { width } = useElementSize(conversationHeader);
const { isAWebWidgetInbox } = useInbox();

// ========== 同步消息功能 ==========
const showSyncModal = ref(false);
const syncLoading = ref(false);
const syncStatus = ref('');
const syncStatusType = ref('');
const startTime = ref('');
const endTime = ref('');
const replaceMode = ref(false);
const direction = ref('both');

// 桥接器配置
const bridgeUrl = 'http://192.168.11.45:7001';
const apiToken = 'your-generated-token';

// 执行同步
const doSync = async (params) => {
  syncLoading.value = true;
  syncStatusType.value = 'loading';
  syncStatus.value = '正在同步消息...';

  try {
    const response = await fetch(`${bridgeUrl}/sync-messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': apiToken,
      },
      body: JSON.stringify({
        conversation_id: Number(currentChat.value.id),
        direction: direction.value,
        replace: replaceMode.value,
        ...params,
      }),
    });

    const result = await response.json();

    if (result.ok) {
      syncStatusType.value = 'success';
      syncStatus.value = `同步完成！成功 ${result.summary?.synced || 0} 条，失败 ${result.summary?.failed || 0} 条`;
      useAlert(`同步完成！成功 ${result.summary?.synced || 0} 条`);
      setTimeout(() => {
        store.dispatch('fetchPreviousMessages', {
          conversationId: currentChat.value.id,
          before: null,
        });
      }, 2000);
    } else {
      throw new Error(result.error || '同步失败');
    }
  } catch (error) {
    syncStatusType.value = 'error';
    syncStatus.value = `同步失败：${error.message}`;
    useAlert(`同步失败：${error.message}`);
  } finally {
    syncLoading.value = false;
  }
};

const syncRecent = (hours) => doSync({ hours });
const syncCustom = () => {
  if (!startTime.value || !endTime.value) return;
  doSync({
    after: new Date(startTime.value).toISOString(),
    before: new Date(endTime.value).toISOString(),
  });
};

const closeSyncModal = () => {
  showSyncModal.value = false;
  syncStatus.value = '';
  syncStatusType.value = '';
};
// ========== 同步消息功能结束 ==========

const currentChat = computed(() => store.getters.getSelectedChat);
const accountId = computed(() => store.getters.getCurrentAccountId);

const chatMetadata = computed(() => props.chat.meta);

const backButtonUrl = computed(() => {
  const {
    params: { inbox_id: inboxId, label, teamId, id: customViewId },
    name,
  } = route;

  const conversationTypeMap = {
    conversation_through_mentions: 'mention',
    conversation_through_unattended: 'unattended',
  };
  return conversationListPageURL({
    accountId: accountId.value,
    inboxId,
    label,
    teamId,
    conversationType: conversationTypeMap[name],
    customViewId,
  });
});

const isHMACVerified = computed(() => {
  if (!isAWebWidgetInbox.value) {
    return true;
  }
  return chatMetadata.value.hmac_verified;
});

const currentContact = computed(() =>
  store.getters['contacts/getContact'](props.chat.meta.sender.id)
);

const isSnoozed = computed(
  () => currentChat.value.status === wootConstants.STATUS_TYPE.SNOOZED
);

const snoozedDisplayText = computed(() => {
  const { snoozed_until: snoozedUntil } = currentChat.value;
  if (snoozedUntil) {
    return `${t('CONVERSATION.HEADER.SNOOZED_UNTIL')} ${snoozedReopenTime(snoozedUntil)}`;
  }
  return t('CONVERSATION.HEADER.SNOOZED_UNTIL_NEXT_REPLY');
});

const inbox = computed(() => {
  const { inbox_id: inboxId } = props.chat;
  return store.getters['inboxes/getInbox'](inboxId);
});

const hasMultipleInboxes = computed(
  () => store.getters['inboxes/getInboxes'].length > 1
);

const hasSlaPolicyId = computed(() => props.chat?.sla_policy_id);

// 判断是否是 API 渠道（WhatsApp 桥接）
const isApiChannel = computed(() => {
  const inboxData = inbox.value;
  if (!inboxData) return false;
  return inboxData.channel_type === 'Channel::Api' ||
    inboxData.channel_type === 'Channel::Whatsapp';
});
</script>

<template>
  <div
    ref="conversationHeader"
    class="flex flex-col gap-3 items-center justify-between flex-1 w-full min-w-0 xl:flex-row px-3 py-2 border-b bg-n-background border-n-weak h-24 xl:h-12"
  >
    <div
      class="flex items-center justify-start w-full xl:w-auto max-w-full min-w-0 xl:flex-1"
    >
      <BackButton
        v-if="showBackButton"
        :back-url="backButtonUrl"
        class="ltr:mr-2 rtl:ml-2"
      />
      <Avatar
        :name="currentContact.name"
        :src="currentContact.thumbnail"
        :size="32"
        :status="currentContact.availability_status"
        hide-offline-status
        rounded-full
      />
      <div
        class="flex flex-col items-start min-w-0 ml-2 overflow-hidden rtl:ml-0 rtl:mr-2"
      >
        <div class="flex flex-row items-center max-w-full gap-1 p-0 m-0">
          <span
            class="text-sm font-medium truncate leading-tight text-n-slate-12"
          >
            {{ currentContact.name }}
          </span>
          <fluent-icon
            v-if="!isHMACVerified"
            v-tooltip="$t('CONVERSATION.UNVERIFIED_SESSION')"
            size="14"
            class="text-n-amber-10 my-0 mx-0 min-w-[14px] flex-shrink-0"
            icon="warning"
          />
        </div>

        <div
          class="flex items-center gap-2 overflow-hidden text-xs conversation--header--actions text-ellipsis whitespace-nowrap"
        >
          <InboxName v-if="hasMultipleInboxes" :inbox="inbox" class="!mx-0" />
          <span v-if="isSnoozed" class="font-medium text-n-amber-10">
            {{ snoozedDisplayText }}
          </span>
        </div>
      </div>
    </div>
    <div
      class="flex flex-row items-center justify-start xl:justify-end flex-shrink-0 gap-2 w-full xl:w-auto header-actions-wrap"
    >
      <SLACardLabel
        v-if="hasSlaPolicyId"
        :chat="chat"
        show-extended-info
        :parent-width="width"
        class="hidden md:flex"
      />

      <!-- 同步 WhatsApp 消息按钮 -->
      <ButtonV4
        v-if="isApiChannel"
        v-tooltip="'同步 WhatsApp 消息'"
        size="sm"
        variant="ghost"
        color="slate"
        icon="i-lucide-refresh-cw"
        class="rounded-md hover:bg-n-alpha-2"
        @click="showSyncModal = true"
      />

      <MoreActions :conversation-id="currentChat.id" />

      <!-- 同步消息弹窗 -->
      <Modal
        v-model:show="showSyncModal"
        :on-close="closeSyncModal"
        size="medium"
      >
        <div class="p-6">
          <!-- 标题 -->
          <div class="mb-6">
            <h2 class="text-lg font-semibold text-n-slate-12">
              同步 WhatsApp 消息
            </h2>
            <p class="text-sm text-n-slate-11 mt-1">
              从 WhatsApp 同步历史消息到当前会话
            </p>
          </div>

          <div class="space-y-4">
            <!-- 快捷选项 -->
            <div class="p-4 bg-n-alpha-1 rounded-lg">
              <h4 class="text-sm font-medium mb-3 text-n-slate-12">快捷同步</h4>
              <div class="flex flex-wrap gap-2">
                <ButtonV4
                  size="sm"
                  variant="faded"
                  color="slate"
                  :disabled="syncLoading"
                  @click="syncRecent(12)"
                >
                  最近 12 小时
                </ButtonV4>
                <ButtonV4
                  size="sm"
                  variant="faded"
                  color="slate"
                  :disabled="syncLoading"
                  @click="syncRecent(24)"
                >
                  最近 24 小时
                </ButtonV4>
                <ButtonV4
                  size="sm"
                  variant="faded"
                  color="slate"
                  :disabled="syncLoading"
                  @click="syncRecent(24 * 7)"
                >
                  最近 7 天
                </ButtonV4>
                <ButtonV4
                  size="sm"
                  variant="faded"
                  color="slate"
                  :disabled="syncLoading"
                  @click="syncRecent(24 * 30 * 3)"
                >
                  最近 3 个月
                </ButtonV4>
              </div>
            </div>

            <!-- 自定义时间范围 -->
            <div class="p-4 bg-n-alpha-1 rounded-lg">
              <h4 class="text-sm font-medium mb-3 text-n-slate-12">自定义时间范围</h4>
              <div class="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label class="text-xs text-n-slate-11">开始时间</label>
                  <input
                    v-model="startTime"
                    type="datetime-local"
                    class="w-full mt-1 px-3 py-2 border border-n-weak rounded-md text-sm bg-n-solid-2 text-n-slate-12"
                  />
                </div>
                <div>
                  <label class="text-xs text-n-slate-11">结束时间</label>
                  <input
                    v-model="endTime"
                    type="datetime-local"
                    class="w-full mt-1 px-3 py-2 border border-n-weak rounded-md text-sm bg-n-solid-2 text-n-slate-12"
                  />
                </div>
              </div>
              <ButtonV4
                size="sm"
                variant="faded"
                color="slate"
                :disabled="syncLoading || !startTime || !endTime"
                @click="syncCustom"
              >
                同步指定范围
              </ButtonV4>
            </div>

            <!-- 同步选项 -->
            <div class="p-4 bg-n-alpha-1 rounded-lg">
              <h4 class="text-sm font-medium mb-3 text-n-slate-12">同步选项</h4>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="replaceMode"
                  type="checkbox"
                  class="rounded border-n-weak"
                />
                <span class="text-sm text-n-slate-12">替换模式（删除现有消息后重新同步）</span>
              </label>
              <p class="text-xs text-n-slate-11 mt-1 ml-6">
                勾选后会先删除该时间段内的现有消息
              </p>

              <div class="mt-3">
                <label class="text-xs text-n-slate-11">同步方向</label>
                <select
                  v-model="direction"
                  class="mt-1 w-full px-3 py-2 border border-n-weak rounded-md text-sm bg-n-solid-2 text-n-slate-12"
                >
                  <option value="both">双向（收发消息）</option>
                  <option value="incoming">仅接收的消息</option>
                  <option value="outgoing">仅发送的消息</option>
                </select>
              </div>
            </div>

            <!-- 状态显示 -->
            <div
              v-if="syncStatus"
              class="p-3 rounded-lg text-sm"
              :class="{
                'bg-n-teal-2 text-n-teal-11': syncStatusType === 'success',
                'bg-n-ruby-2 text-n-ruby-11': syncStatusType === 'error',
                'bg-n-blue-2 text-n-blue-11': syncStatusType === 'loading',
              }"
            >
              <div class="flex items-center gap-2">
                <span
                  v-if="syncStatusType === 'loading'"
                  class="i-lucide-loader-2 animate-spin w-4 h-4"
                />
                <span>{{ syncStatus }}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  </div>
</template>
