import deepcopy from "deepcopy"
import { onUnmounted } from "vue"
import { events } from "./events"

export function useCommand(data, focusData) {
  //1. 定义命令的状态
  const state = {
    //前进后退需要指针（索引值）
    current: -1,
    queue: [],  //用一个存栈存放所有操作命令
    commands: {}, //命令和执行函数的映射表
    commandsArray: [],//存放所有命令
    destoryArray: [], //销毁命令的函数
  }

  //2. 注册命令的函数
  const registry = (command) => {
    state.commandsArray.push(command)
    state.commands[command.name] = (...args) => {  //重写命令对应的执行函数，为了传递参数
      const { redo, undo } = command.execute(...args)
      redo()
      //判断操作是否要放到队列中  为了实现操作的前进后退
      if (!command.pushQueue) {
        return
      }
      let { queue, current } = state

      //防止在放置的过程中有撤销操作
      if (queue.length > 0) {
        //根据当前最新的current 求出新的queue
        queue = queue.slice(0, current + 1)
        state.queue = queue
      }

      queue.push({ redo, undo })
      state.current = current + 1
    }
  }

  //注册命令
  //重做
  registry({
    name: 'redo',
    keyboard: 'ctrl+y',
    execute() {
      return {
        redo() {
          let item = state.queue[state.current + 1]
          if (item) {
            item.redo && item.redo()
            state.current++
          }
        }
      }
    }
  })
  //撤销
  registry({
    name: 'undo',
    keyboard: 'ctrl+z',
    execute() {
      return {
        redo() {
          //没有撤销操作
          if (state.current === -1) {
            return
          }
          let item = state.queue[state.current]  //不会操作队列 只是修改了current指针
          if (item) {
            item.undo && item.undo()
            state.current--
          }
        }
      }
    }
  })
  // 拖拽
  registry({  //如果希望将操作放到队列中，可以增加一个属性，标识等会操作要放到队列中
    name: 'drag',
    pushQueue: true,
    init() {  //初始化操作 （监听拖拽开始事件和结束事件），一开始就执行
      //先把拖拽之前的状态保存起来
      this.before = null
      const start = () => {
        this.before = deepcopy(data.value.blocks)
      }
      //拖拽之后触发对应的指令
      const end = () => {
        state.commands.drag()  //执行drag命令的redo方法
      }
      events.on('start', start)  //拖动的时候会触发
      events.on('end', end)      //拖动结束之后会触发

      //关闭监听的函数
      return () => {
        events.off('start', start)
        events.off('end', end)
      }
    },
    //拖拽结束之后被触发
    execute() {
      let before = this.before
      //当前状态
      let after = data.value.blocks
      return {
        redo() {  //默认松手，就把当前的事情做了
          data.value = { ...data.value, blocks: after }
        },
        undo() { //撤回操作
          data.value = { ...data.value, blocks: before }
        }
      }
    }
  })

  //导入指令  更新整个容器 （data.value）
  registry({
    name: 'updateContainer',
    pushQueue: true,
    execute(newValue) {
      let state = {
        before: data.value,
        after: newValue
      }
      return {
        redo() {
          data.value = state.after
        },
        undo() {
          data.value = state.before
        }
      }
    }
  })

  // 导入指令  更新单个block (data.value.blocks)
  registry({
    name: 'updateBlock',
    pushQueue: true,
    execute(newBlock, oldBlock) {
      let state = {
        before: data.value.blocks,
        after: () => {
          let blocks = [...data.value.blocks]  //拷贝一份用于新的blocks
          let index = data.value.blocks.indexOf(oldBlock)  //在老的里面找修改的是哪一个，把他替换掉
          if (index > -1) {
            blocks.splice(index, 1, newBlock)
          }

          return blocks
        }
      }


      return {
        redo() {
          data.value = { ...data.value, blocks: state.after() }
        },
        undo() {
          data.value = { ...data.value, blocks: state.before }
        }
      }
    }
  })

  //置顶
  registry({
    name: 'placeTop',
    pushQueue: true,
    execute() {
      let before = deepcopy(data.value.blocks) //需要深拷贝 因为在vue3中如果修改前后的对象是同一个对象，就不会触发更新
      let after = () => {
        let { focus, unfocused } = focusData.value

        //1.找到ZIndex最大的
        let maxZIndex = unfocused.reduce((pre, block) => {
          return Math.max(pre, block.zIndex)
        }, -Infinity)

        //2. 然后把当前选中的组件的ZIndex改成比他更大
        focus.forEach(block => block.zIndex = maxZIndex + 1)
        return data.value.blocks
      }
      return {
        redo: () => {
          data.value = { ...data.value, blocks: after() }
        },
        undo: () => {
          data.value = { ...data.value, blocks: before }
        }
      }
    }
  })
  //置底
  registry({
    name: 'placeBottom',
    pushQueue: true,
    execute() {
      let before = deepcopy(data.value.blocks) //需要深拷贝 因为在vue3中如果修改前后的对象是同一个对象，就不会触发更新
      let after = () => {
        let { focus, unfocused } = focusData.value

        //1.找到ZIndex最小的
        let minZIndex = unfocused.reduce((pre, block) => {
          return Math.min(pre, block.zIndex)
        }, Infinity)

        //不能是负值，不然可能看不到
        //如果是负值，则让没选中的增加，自己变成0
        if (minZIndex < 0) {
          const dur = Math.abs(minZIndex)
          minZIndex = 0
          unfocused.forEach(block => block.zIndex += dur)
        }

        focus.forEach(block => block.zIndex = minZIndex)
        return data.value.blocks
      }
      return {
        redo: () => {
          data.value = { ...data.value, blocks: after() }
        },
        undo: () => {
          data.value = { ...data.value, blocks: before }
        }
      }
    }
  })

  //删除
  registry({
    name: 'delete',
    pushQueue: true,
    execute() {
      let before = data.value.blocks
      let after = focusData.value.unfocused //选中的都删除了
      return {
        redo() {
          data.value = { ...data.value, blocks: after }
        },
        undo() {
          data.value = { ...data.value, blocks: before }
        }
      }
    }
  })

  //监听键盘事件
  const keyboardEvent = () => {
    const keyCodes = {
      90: 'z',
      89: 'y'
    }
    const onKeydown = (e) => {
      const { ctrlKey, keyCode } = e  //ctrl+z / ctrl+y
      let keyString = []

      if (ctrlKey) {
        keyString.push('ctrl')
      }
      keyString.push(keyCodes[keyCode])
      keyString = keyString.join('+')

      state.commandsArray.forEach(({ keyboard, name }) => {
        if (!keyboard) {
          return
        }
        if (keyString === keyboard) {
          state.commands[name]()
          e.preventDefault() //阻止键盘默认时间	
        }
      })

    }
    const init = () => { //初始化事件
      window.addEventListener('keydown', onKeydown)
      //返回取消监听的函数  销毁事件
      return () => {
        window.removeEventListener('keydown', onkeydown)
      }
    }
    return init
  }

  //3.命令的初始化
  function first() {
    //监听键盘事件
    state.destoryArray.push(keyboardEvent()())
    state.commandsArray.forEach(command => state.destoryArray.push(command.init && command.init()))
  }
  first()

  //4. 当组件销毁的时候执行命令的销毁函数=>清除事件的监听（有才执行）
  onUnmounted(() => {
    state.destoryArray.forEach(fn => fn && fn())
  })
  return state
}