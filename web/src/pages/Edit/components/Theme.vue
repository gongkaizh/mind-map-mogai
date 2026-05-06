<template>
  <Sidebar ref="sidebar" :title="$t('theme.title')">
    <div class="themeGroupList" :class="{ isDark: isDark }">
      <!-- 默认主题设置 -->
      <div class="defaultThemeSection">
        <div class="sectionTitle">{{ $t('theme.defaultTheme') }}</div>
        <div class="defaultThemeContent">
          <!-- 当前主题显示 -->
          <div class="currentThemeDisplay">
            <span class="currentThemeLabel">{{ $t('theme.currentTheme') }}:</span>
            <span class="currentThemeName">{{ currentThemeName }}</span>
          </div>

          <!-- 默认主题选择 -->
          <div class="defaultThemeSelect">
            <label class="selectLabel">{{ $t('theme.setDefaultTheme') }}:</label>
            <el-select
              v-model="defaultTheme"
              @change="setDefaultTheme"
              :placeholder="$t('theme.selectDefaultTheme')"
              size="small"
            >
              <el-option
                v-for="item in allThemesList"
                :key="item.value"
                :label="item.name"
                :value="item.value"
              ></el-option>
            </el-select>
          </div>

          <div class="defaultThemeNote">{{ $t('theme.defaultThemeNote') }}</div>
        </div>
      </div>

      <el-tabs v-model="activeName" class="tabBox">
        <el-tab-pane
          v-for="group in groupList"
          :key="group.name"
          :label="group.name"
          :name="group.name"
        ></el-tab-pane>
      </el-tabs>
      <div class="themeListTheme customScrollbar">
        <div
          class="themeItem"
          v-for="item in currentList"
          :key="item.value"
          @click="useTheme(item)"
          :class="{ active: item.value === theme }"
        >
          <div class="imgBox">
            <img :src="item.img || themeImgMap[item.value]" alt="" />
          </div>
          <div class="name">{{ item.name }}</div>
        </div>
      </div>
    </div>
  </Sidebar>
</template>

<script>
import Sidebar from './Sidebar.vue'
import { storeData, getLocalConfig, storeLocalConfig } from '@/api'
import { mapState, mapMutations } from 'vuex'
import themeImgMap from 'simple-mind-map-plugin-themes/themeImgMap'
import themeList from 'simple-mind-map-plugin-themes/themeList'

// 主题
export default {
  components: {
    Sidebar
  },
  props: {
    data: {
      type: [Object, null],
      default: null
    },
    mindMap: {
      type: Object
    }
  },
  data() {
    return {
      themeList: [
        {
          name: '默认主题',
          value: 'default',
          dark: false
        },
        {
          name: '橙汁',
          value: 'orangeJuice',
          dark: false
        },
        ...themeList
      ].reverse(),
      themeImgMap,
      theme: '',
      activeName: '',
      defaultGroupList: [],
      defaultTheme: ''
    }
  },
  computed: {
    ...mapState({
      isDark: state => state.localConfig.isDark,
      activeSidebar: state => state.activeSidebar,
      extendThemeGroupList: state => state.extendThemeGroupList
    }),

    groupList() {
      return [...this.defaultGroupList, ...this.extendThemeGroupList]
    },

    currentList() {
      return this.groupList.find(item => {
        return item.name === this.activeName
      }).list
    },

    // 所有主题的列表，用于默认主题选择
    allThemesList() {
      const extendThemeList = []
      this.extendThemeGroupList.forEach(group => {
        extendThemeList.push(...group.list)
      })
      return [...this.themeList, ...extendThemeList]
    },

    // 当前主题名称
    currentThemeName() {
      const currentTheme = this.allThemesList.find(item => item.value === this.theme)
      return currentTheme ? currentTheme.name : this.theme || '未知主题'
    }
  },
  watch: {
    activeSidebar(val) {
      if (val === 'theme') {
        this.theme = this.mindMap.getTheme()
        this.$refs.sidebar.show = true
      } else {
        this.$refs.sidebar.show = false
      }
    }
  },
  created() {
    this.initGroup()
    this.theme = this.mindMap.getTheme()
    this.initDefaultTheme()
    this.mindMap.on('view_theme_change', this.handleViewThemeChange)
  },
  beforeDestroy() {
    this.mindMap.off('view_theme_change', this.handleViewThemeChange)
  },
  methods: {
    ...mapMutations(['setLocalConfig']),

    handleViewThemeChange() {
      this.theme = this.mindMap.getTheme()
      this.handleDark()
    },

    initGroup() {
      const baiduThemes = [
        'default',
        'skyGreen',
        'classic2',
        'classic3',
        'classicGreen',
        'classicBlue',
        'blueSky',
        'brainImpairedPink',
        'earthYellow',
        'freshGreen',
        'freshRed',
        'romanticPurple',
        'pinkGrape',
        'mint'
      ]
      const baiduList = []
      const classicsList = []
      this.themeList.forEach(item => {
        if (baiduThemes.includes(item.value)) {
          baiduList.push(item)
        } else if (!item.dark) {
          classicsList.push(item)
        }
      })
      this.defaultGroupList = [
        {
          name: this.$t('theme.classics'),
          list: classicsList
        },
        {
          name: this.$t('theme.dark'),
          list: this.themeList.filter(item => {
            return item.dark
          })
        },
        {
          name: this.$t('theme.simple'),
          list: baiduList
        }
      ]
      this.activeName = this.defaultGroupList[0].name
    },

    useTheme(theme) {
      if (theme.value === this.theme) return
      this.theme = theme.value
      this.handleDark()
      const customThemeConfig = this.mindMap.getCustomThemeConfig()
      const hasCustomThemeConfig = Object.keys(customThemeConfig).length > 0
      if (hasCustomThemeConfig) {
        this.$confirm(this.$t('theme.coverTip'), this.$t('theme.tip'), {
          confirmButtonText: this.$t('theme.cover'),
          cancelButtonText: this.$t('theme.reserve'),
          type: 'warning',
          distinguishCancelAndClose: true,
          callback: action => {
            if (action === 'confirm') {
              this.mindMap.setThemeConfig({}, true)
              this.data.theme.config = {}
              this.changeTheme(theme, {})
            } else if (action === 'cancel') {
              this.changeTheme(theme, customThemeConfig)
            }
          }
        })
      } else {
        this.changeTheme(theme, customThemeConfig)
      }
    },

    changeTheme(theme, config) {
      this.$bus.$emit('showLoading')
      this.mindMap.setTheme(theme.value)
      storeData({
        theme: {
          template: theme.value,
          config
        }
      })
    },

    handleDark() {
      const extendThemeList = []
      this.extendThemeGroupList.forEach(group => {
        extendThemeList.push(...group.list)
      })
      let target = [...this.themeList, ...extendThemeList].find(item => {
        return item.value === this.theme
      })
      this.setLocalConfig({
        isDark: target.dark
      })
    },

    // 初始化默认主题设置
    initDefaultTheme() {
      const localConfig = getLocalConfig()
      this.defaultTheme = localConfig.theme || 'orangeJuice'
    },

    // 设置默认主题
    setDefaultTheme(theme) {
      const localConfig = getLocalConfig()
      const newConfig = {
        ...localConfig,
        theme: theme
      }
      storeLocalConfig(newConfig)
      this.setLocalConfig(newConfig)

      this.$message.success(this.$t('theme.defaultThemeSetSuccess'))
    }
  }
}
</script>

<style lang="less" scoped>
.themeGroupList {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;

  &.isDark {
    .name {
      color: #fff;
    }

    .defaultThemeSection {
      .sectionTitle {
        color: #fff;
      }

      .defaultThemeContent {
        .currentThemeDisplay {
          background-color: #2c2c2c;
          border-left-color: #66b1ff;

          .currentThemeLabel {
            color: #ccc;
          }

          .currentThemeName {
            color: #66b1ff;
          }
        }

        .selectLabel {
          color: #ccc;
        }
      }

      .defaultThemeNote {
        color: #ccc;
      }
    }
  }

  .defaultThemeSection {
    flex-shrink: 0;
    padding: 15px;
    border-bottom: 1px solid #e8e8e8;
    margin-bottom: 10px;

    .sectionTitle {
      font-size: 14px;
      font-weight: 500;
      color: #333;
      margin-bottom: 10px;
    }

    .defaultThemeContent {
      .currentThemeDisplay {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        padding: 8px 12px;
        background-color: #f8f9fa;
        border-radius: 4px;
        border-left: 3px solid #409eff;

        .currentThemeLabel {
          font-size: 13px;
          color: #666;
          margin-right: 8px;
        }

        .currentThemeName {
          font-size: 13px;
          font-weight: 500;
          color: #409eff;
        }
      }

      .defaultThemeSelect {
        margin-bottom: 10px;

        .selectLabel {
          display: block;
          font-size: 13px;
          color: #666;
          margin-bottom: 6px;
        }
      }

      .defaultThemeNote {
        font-size: 12px;
        color: #999;
        margin-top: 8px;
        line-height: 1.4;
      }
    }
  }

  .tabBox {
    flex-shrink: 0;

    /deep/ .el-tabs__nav-wrap {
      display: flex;
      justify-content: center;
    }
  }

  .themeListTheme {
    height: 100%;
    overflow-y: auto;
    padding: 0 20px;

    .themeItem {
      width: 100%;
      cursor: pointer;
      border-bottom: 1px solid #e9e9e9;
      margin-bottom: 20px;
      padding-bottom: 20px;
      transition: all 0.2s;
      border: 3px solid transparent;
      border-radius: 5px;
      overflow: hidden;

      &:last-of-type {
        border: none;
      }

      &:hover {
        box-shadow: 0 1px 2px -2px rgba(0, 0, 0, 0.16),
          0 3px 6px 0 rgba(0, 0, 0, 0.12), 0 5px 12px 4px rgba(0, 0, 0, 0.09);
      }

      &.active {
        border: 3px solid rgb(154, 198, 250);
      }

      .imgBox {
        width: 100%;

        img {
          width: 100%;
        }
      }
      .name {
        text-align: center;
        font-size: 14px;
      }
    }
  }
}
</style>