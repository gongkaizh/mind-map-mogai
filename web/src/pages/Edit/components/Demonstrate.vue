<template>
  <div class="demonstrateContainer" :class="{ isDark: isDark }">
    <el-tooltip
      class="item"
      effect="dark"
      :content="$t('demonstrate.demonstrate')"
      placement="top"
    >
      <div class="btn iconfont iconyanshibofang" @click="enterDemoMode"></div>
    </el-tooltip>
    <el-tooltip
      class="item"
      effect="dark"
      :content="$t('demonstrate.demonstrateFromCurrent')"
      placement="top"
    >
      <div class="btn iconfont icondingwei" @click="enterDemoModeFromCurrent"></div>
    </el-tooltip>
    <el-tooltip
      class="item"
      effect="dark"
      :content="$t('demonstrate.layeredMode')"
      placement="top"
    >
      <div 
        class="btn iconfont icondaohang1" 
        :class="{ active: isLayeredMode }"
        @click="toggleLayeredMode"
      ></div>
    </el-tooltip>
    <div
      class="exitDemonstrateBtn"
      @click="exit"
      ref="exitDemonstrateBtnRef"
      v-if="isEnterDemonstrate"
      @mousedown.stop
      @mousemove.stop
      @mouseup.stop
    >
      <span class="icon iconfont iconguanbi"></span>
    </div>
    <div
      class="stepBox"
      ref="stepBoxRef"
      v-if="isEnterDemonstrate"
      @mousedown.stop
      @mousemove.stop
      @mouseup.stop
    >
      <div class="jump" @click="prev" :class="{ disabled: curStepIndex <= 0 }">
        <span class="icon el-icon-back"></span>
      </div>
      <div class="step">{{ curStepIndex + 1 }} / {{ totalStep }}</div>
      <div
        class="jump"
        @click="next"
        :class="{ disabled: curStepIndex >= totalStep - 1 }"
      >
        <span class="icon el-icon-right"></span>
      </div>
      <div class="input">
        <input
          type="text"
          v-model="inputStep"
          @keyup.enter.stop="onEnter"
          @keydown.stop
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    mindMap: {
      type: Object
    },
    isDark: {
      type: Boolean
    }
  },
  data() {
    return {
      isEnterDemonstrate: false,
      curStepIndex: 0,
      totalStep: 0,
      inputStep: '',
      isLayeredMode: false // 是否开启分层演示模式
    }
  },
  created() {
    this.$bus.$on('demonstrate_jump', this.onJump)
    this.$bus.$on('exit_demonstrate', this.onExit)
  },
  methods: {
    enterDemoMode() {
      this.isEnterDemonstrate = true
      this.$nextTick(() => {
        const el = document.querySelector('#mindMapContainer')
        el.appendChild(this.$refs.exitDemonstrateBtnRef)
        el.appendChild(this.$refs.stepBoxRef)
      })
      // 设置分层演示模式配置
      this.mindMap.demonstrate.updateConfig({
        layeredMode: this.isLayeredMode
      })
      this.mindMap.demonstrate.enter()
    },

    enterDemoModeFromCurrent() {
      this.isEnterDemonstrate = true
      this.$nextTick(() => {
        const el = document.querySelector('#mindMapContainer')
        el.appendChild(this.$refs.exitDemonstrateBtnRef)
        el.appendChild(this.$refs.stepBoxRef)
      })
      // 设置分层演示模式配置
      this.mindMap.demonstrate.updateConfig({
        layeredMode: this.isLayeredMode
      })
      // 检查是否有激活的节点，如果没有则从根节点开始演示
      if (this.mindMap.renderer.activeNodeList.length === 0) {
        this.mindMap.demonstrate.enter()
      } else {
        this.mindMap.demonstrate.enterFromCurrentNode()
      }
    },

    exit() {
      this.mindMap.demonstrate.exit()
    },

    onExit() {
      this.isEnterDemonstrate = false
      this.curStepIndex = 0
      this.totalStep = 0
    },

    onJump(index, total) {
      this.curStepIndex = index
      this.totalStep = total
    },

    prev() {
      this.mindMap.demonstrate.prev()
    },

    next() {
      this.mindMap.demonstrate.next()
    },

    onEnter() {
      const num = Number(this.inputStep)
      if (Number.isNaN(num)) {
        this.inputStep = ''
      } else if (num >= 1 && num <= this.totalStep) {
        this.mindMap.demonstrate.jump(num - 1)
      }
    },

    // 切换分层演示模式
    toggleLayeredMode() {
      this.isLayeredMode = !this.isLayeredMode
    }
  }
}
</script>

<style lang="less" scoped>
.demonstrateContainer {
  display: flex;
  align-items: center;

  &.isDark {
    .btn {
      color: hsla(0, 0%, 100%, 0.6);
    }
  }

  .item {
    margin-right: 12px;

    &:last-of-type {
      margin-right: 0;
    }
  }

  .btn {
    cursor: pointer;
    font-size: 24px;
    
    &.active {
      color: #409eff;
    }
  }
}

.exitDemonstrateBtn {
  position: absolute;
  right: 40px;
  top: 20px;
  cursor: pointer;
  z-index: 10001;
  pointer-events: all;

  .icon {
    font-size: 28px;
    color: #fff;
  }
}

.stepBox {
  position: absolute;
  right: 40px;
  bottom: 20px;
  pointer-events: all;

  z-index: 10001;
  display: flex;
  align-items: center;

  .step {
    color: #fff;
    margin: 0 12px;
  }

  .jump {
    color: #fff;
    cursor: pointer;

    &.disabled {
      cursor: not-allowed;
      color: #999;
    }
  }

  .input {
    margin-left: 12px;
    display: flex;
    align-items: center;

    input {
      width: 50px;
      height: 30px;
      text-align: center;
      background-color: transparent;
      border: 1px solid #999;
      outline: none;
      color: #fff;
    }
  }
}
</style>
