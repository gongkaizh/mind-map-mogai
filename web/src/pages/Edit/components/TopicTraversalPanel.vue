<template>
  <Sidebar ref="sidebar" :title="$t('topicTraversal.title')">
    <div class="sidebarContent customScrollbar" :class="{ isDark: isDark }">
      <!-- 遍历模式选择 -->
      <div class="row">
        <div class="rowItem">
          <span class="name">{{ $t('topicTraversal.mode') }}</span>
          <el-radio-group v-model="selectedMode" size="mini" @change="onModeChange">
            <el-radio-button label="depth">{{ $t('topicTraversal.depthFirst') }}</el-radio-button>
            <el-radio-button label="breadth">{{ $t('topicTraversal.breadthFirst') }}</el-radio-button>
            <el-radio-button label="level">{{ $t('topicTraversal.sameLevel') }}</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 遍历控制 -->
      <div class="row">
        <div class="rowItem">
          <span class="name">{{ $t('topicTraversal.control') }}</span>
          <div class="controlButtons">
            <el-button
              size="mini"
              type="primary"
              @click="startTraversal"
              :disabled="isTraversing"
            >
              {{ $t('topicTraversal.start') }}
            </el-button>
            <el-button
              size="mini"
              @click="previousTopic"
              :disabled="!isTraversing"
            >
              {{ $t('topicTraversal.previous') }}
            </el-button>
            <el-button
              size="mini"
              @click="nextTopic"
              :disabled="!isTraversing"
            >
              {{ $t('topicTraversal.next') }}
            </el-button>
            <el-button
              size="mini"
              type="danger"
              @click="stopTraversal"
              :disabled="!isTraversing"
            >
              {{ $t('topicTraversal.stop') }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 遍历状态 -->
      <div v-if="isTraversing" class="row">
        <div class="rowItem">
          <span class="name">{{ $t('topicTraversal.status') }}</span>
          <div class="statusInfo">
            <div class="statusItem">
              <span>{{ $t('topicTraversal.current') }}: {{ currentIndex + 1 }} / {{ totalCount }}</span>
            </div>
            <div class="statusItem">
              <el-progress
                :percentage="progressPercentage"
                :show-text="false"
                :stroke-width="6"
              ></el-progress>
            </div>
          </div>
        </div>
      </div>

      <!-- 快捷键提示 -->
      <div class="row">
        <div class="rowItem">
          <span class="name">{{ $t('topicTraversal.shortcuts') }}</span>
          <div class="shortcutList">
            <div class="shortcutItem">
              <span class="shortcutKey">F3</span>
              <span class="shortcutDesc">{{ $t('topicTraversal.nextShortcut') }}</span>
            </div>
            <div class="shortcutItem">
              <span class="shortcutKey">Shift+F3</span>
              <span class="shortcutDesc">{{ $t('topicTraversal.previousShortcut') }}</span>
            </div>
            <div class="shortcutItem">
              <span class="shortcutKey">Ctrl+Shift+↑</span>
              <span class="shortcutDesc">{{ $t('topicTraversal.depthFirstShortcut') }}</span>
            </div>
            <div class="shortcutItem">
              <span class="shortcutKey">Ctrl+Shift+↓</span>
              <span class="shortcutDesc">{{ $t('topicTraversal.breadthFirstShortcut') }}</span>
            </div>
            <div class="shortcutItem">
              <span class="shortcutKey">Esc</span>
              <span class="shortcutDesc">{{ $t('topicTraversal.exitShortcut') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Sidebar>
</template>

<script>
import { mapState } from 'vuex'
import Sidebar from './Sidebar.vue'

export default {
  name: 'TopicTraversalPanel',
  components: {
    Sidebar
  },
  props: {
    mindMap: {
      type: Object
    }
  },
  data() {
    return {
      selectedMode: 'depth',
      isTraversing: false,
      currentIndex: -1,
      totalCount: 0
    }
  },
  computed: {
    ...mapState(['isDark']),
    progressPercentage() {
      if (this.totalCount === 0) return 0
      return Math.round(((this.currentIndex + 1) / this.totalCount) * 100)
    }
  },
  mounted() {
    if (this.mindMap) {
      this.bindEvents()
    }
  },
  beforeDestroy() {
    if (this.mindMap) {
      this.unbindEvents()
    }
  },
  methods: {
    bindEvents() {
      this.mindMap.on('topic_traversal_start', this.onTraversalStart)
      this.mindMap.on('topic_traversal_change', this.onTraversalChange)
      this.mindMap.on('topic_traversal_end', this.onTraversalEnd)
    },
    
    unbindEvents() {
      this.mindMap.off('topic_traversal_start', this.onTraversalStart)
      this.mindMap.off('topic_traversal_change', this.onTraversalChange)
      this.mindMap.off('topic_traversal_end', this.onTraversalEnd)
    },



    onModeChange(mode) {
      this.selectedMode = mode
    },

    startTraversal() {
      if (this.mindMap && this.mindMap.topicTraversal) {
        this.mindMap.topicTraversal.startTraversal(this.selectedMode)
      }
    },

    previousTopic() {
      if (this.mindMap && this.mindMap.topicTraversal) {
        this.mindMap.topicTraversal.previousTopic()
      }
    },

    nextTopic() {
      if (this.mindMap && this.mindMap.topicTraversal) {
        this.mindMap.topicTraversal.nextTopic()
      }
    },

    stopTraversal() {
      if (this.mindMap && this.mindMap.topicTraversal) {
        this.mindMap.topicTraversal.exitTraversalMode()
      }
    },

    onTraversalStart(data) {
      this.isTraversing = true
      this.currentIndex = data.currentIndex
      this.totalCount = data.totalCount
      this.selectedMode = data.mode
    },

    onTraversalChange(data) {
      this.currentIndex = data.currentIndex
      this.totalCount = data.totalCount
    },

    onTraversalEnd() {
      this.isTraversing = false
      this.currentIndex = -1
      this.totalCount = 0
    }
  }
}
</script>

<style lang="less" scoped>
.sidebarContent {
  .row {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    .rowItem {
      .name {
        display: block;
        margin-bottom: 8px;
        font-size: 13px;
        color: #666;

        .isDark & {
          color: #ccc;
        }
      }

      .controlButtons {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }

      .statusInfo {
        .statusItem {
          margin-bottom: 8px;
          font-size: 12px;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }

      .shortcutList {
        .shortcutItem {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          font-size: 12px;

          &:last-child {
            margin-bottom: 0;
          }

          .shortcutKey {
            background-color: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 11px;

            .isDark & {
              background-color: #3a3a3a;
              color: #fff;
            }
          }

          .shortcutDesc {
            color: #666;

            .isDark & {
              color: #ccc;
            }
          }
        }
      }
    }
  }
}
</style>
