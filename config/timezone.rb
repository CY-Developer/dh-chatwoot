# frozen_string_literal: true

# 强制设置 Rails 应用时区为上海时区
# 文件位置: config/initializers/timezone.rb

Rails.application.config.time_zone = 'Asia/Shanghai'
Time.zone = 'Asia/Shanghai'

# ActiveRecord 使用本地时区存储时间
# 如果你希望数据库存储 UTC 但显示上海时间，使用 :utc
# 如果你希望数据库直接存储上海时间，使用 :local
ActiveRecord::Base.default_timezone = :utc

# 日志记录
Rails.logger.info "Timezone initialized: #{Time.zone.name}" if Rails.logger
