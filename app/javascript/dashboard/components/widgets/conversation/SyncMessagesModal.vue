<template>
  <woot-modal :show.sync="show" :on-close="onClose">
    <div class="sync-messages-modal">
      <woot-modal-header
        :header-title="$t('SYNC_MESSAGES.TITLE')"
        :header-content="$t('SYNC_MESSAGES.DESC')"
      />

      <div class="modal-content">
        <!-- 快捷选项 -->
        <div class="quick-options">
          <h4>{{ $t('SYNC_MESSAGES.QUICK_OPTIONS') }}</h4>
          <div class="button-group">
            <woot-button
              variant="smooth"
              size="small"
              @click="syncRecent(12)"
            >
              {{ $t('SYNC_MESSAGES.LAST_12_HOURS') }}
            </woot-button>
            <woot-button
              variant="smooth"
              size="small"
              @click="syncRecent(24)"
            >
              {{ $t('SYNC_MESSAGES.LAST_24_HOURS') }}
            </woot-button>
            <woot-button
              variant="smooth"
              size="small"
              @click="syncRecent(24 * 7)"
            >
              {{ $t('SYNC_MESSAGES.LAST_7_DAYS') }}
            </woot-button>
            <woot-button
              variant="smooth"
              size="small"
              @click="syncRecent(24 * 30 * 3)"
            >
              {{ $t('SYNC_MESSAGES.LAST_3_MONTHS') }}
            </woot-button>
          </div>
        </div>

        <!-- 自定义时间范围 -->
        <div class="custom-range">
          <h4>{{ $t('SYNC_MESSAGES.CUSTOM_RANGE') }}</h4>
          <div class="date-inputs">
            <label>
              {{ $t('SYNC_MESSAGES.START_TIME') }}
              <input
                type="datetime-local"
                v-model="customStartTime"
                class="date-input"
              />
            </label>
            <label>
              {{ $t('SYNC_MESSAGES.END_TIME') }}
              <input
                type="datetime-local"
                v-model="customEndTime"
                class="date-input"
              />
            </label>
          </div>
          <woot-button
            variant="smooth"
            size="small"
            :disabled="!customStartTime || !customEndTime"
            @click="syncCustomRange"
          >
            {{ $t('SYNC_MESSAGES.SYNC_CUSTOM') }}
          </woot-button>
        </div>

        <!-- 选项 -->
        <div class="sync-options">
          <h4>{{ $t('SYNC_MESSAGES.OPTIONS') }}</h4>
          <label class="checkbox-label">
            <input type="checkbox" v-model="replaceMode" />
            {{ $t('SYNC_MESSAGES.REPLACE_MODE') }}
          </label>
          <p class="help-text">{{ $t('SYNC_MESSAGES.REPLACE_MODE_HELP') }}</p>

          <label class="select-label">
            {{ $t('SYNC_MESSAGES.DIRECTION') }}
            <select v-model="direction" class="direction-select">
              <option value="both">{{ $t('SYNC_MESSAGES.DIRECTION_BOTH') }}</option>
              <option value="incoming">{{ $t('SYNC_MESSAGES.DIRECTION_INCOMING') }}</option>
              <option value="outgoing">{{ $t('SYNC_MESSAGES.DIRECTION_OUTGOING') }}</option>
            </select>
          </label>
        </div>

        <!-- 状态显示 -->
        <div v-if="syncStatus" class="sync-status" :class="syncStatus.type">
          <spinner v-if="syncStatus.type === 'loading'" size="small" />
          <span>{{ syncStatus.message }}</span>
        </div>
      </div>

      <div class="modal-footer">
        <woot-button variant="clear" @click="onClose">
          {{ $t('SYNC_MESSAGES.CANCEL') }}
        </woot-button>
      </div>
    </div>
  </woot-modal>
</template>

<script>
import Spinner from 'shared/components/Spinner.vue';

export default {
  name: 'SyncMessagesModal',
  components: { Spinner },
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    conversationId: {
      type: [Number, String],
      required: true,
    },
  },
  data() {
    return {
      customStartTime: '',
      customEndTime: '',
      replaceMode: false,
      direction: 'both',
      syncStatus: null,
    };
  },
  computed: {
    // 从环境变量或配置获取桥接器地址
    bridgeUrl() {
      // 你需要在 Chatwoot 配置中添加这个环境变量
      return window.chatwootConfig?.waBridgeUrl || 'http://192.168.11.45:7001';
    },
  },
  methods: {

    onClose() {
      this.$emit('close');
      this.syncStatus = null;
    },

    async syncRecent(hours) {
      await this.doSync({ hours });
    },

    async syncCustomRange() {
      if (!this.customStartTime || !this.customEndTime) return;

      // 转换为 ISO 格式，添加上海时区
      const after = new Date(this.customStartTime).toISOString();
      const before = new Date(this.customEndTime).toISOString();

      await this.doSync({ after, before });
    },

    async doSync(params) {
      this.syncStatus = {
        type: 'loading',
        message: this.$t('SYNC_MESSAGES.SYNCING'),
      };

      try {
        const response = await fetch(`${this.bridgeUrl}/sync-messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-token': 'your-generated-token',
          },
          body: JSON.stringify({
            conversation_id: this.conversationId,
            direction: this.direction,
            replace: this.replaceMode,
            ...params,
          }),
        });

        const result = await response.json();

        if (result.ok) {
          this.syncStatus = {
            type: 'success',
            message: this.$t('SYNC_MESSAGES.SUCCESS', {
              synced: result.summary?.synced || 0,
              failed: result.summary?.failed || 0,
            }),
          };

          // 3秒后关闭弹窗并刷新消息
          setTimeout(() => {
            this.$emit('sync-complete');
            this.onClose();
          }, 3000);
        } else {
          throw new Error(result.error || 'Sync failed');
        }
      } catch (error) {
        this.syncStatus = {
          type: 'error',
          message: this.$t('SYNC_MESSAGES.ERROR', { error: error.message }),
        };
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.sync-messages-modal {
  padding: var(--space-normal);
}

.modal-content {
  padding: var(--space-normal) 0;
}

.quick-options,
.custom-range,
.sync-options {
  margin-bottom: var(--space-normal);
  padding-bottom: var(--space-normal);
  border-bottom: 1px solid var(--color-border);

  h4 {
    margin-bottom: var(--space-small);
    font-weight: var(--font-weight-medium);
  }
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-small);
}

.date-inputs {
  display: flex;
  gap: var(--space-normal);
  margin-bottom: var(--space-small);

  label {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-micro);
  }
}

.date-input {
  padding: var(--space-small);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-normal);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-small);
  cursor: pointer;
}

.select-label {
  display: flex;
  align-items: center;
  gap: var(--space-small);
  margin-top: var(--space-small);
}

.direction-select {
  padding: var(--space-small);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-normal);
}

.help-text {
  font-size: var(--font-size-mini);
  color: var(--color-body);
  margin-top: var(--space-micro);
}

.sync-status {
  display: flex;
  align-items: center;
  gap: var(--space-small);
  padding: var(--space-small);
  border-radius: var(--border-radius-normal);
  margin-top: var(--space-normal);

  &.loading {
    background: var(--color-background);
  }

  &.success {
    background: var(--g-100);
    color: var(--g-800);
  }

  &.error {
    background: var(--r-100);
    color: var(--r-800);
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--space-normal);
  border-top: 1px solid var(--color-border);
}
</style>
