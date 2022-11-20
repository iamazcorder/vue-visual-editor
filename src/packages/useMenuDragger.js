import { events } from "./events"

export function useMenuDragger(data, containerRef) {
  let currentComponent = null

  const dragenter = (e) => {
    e.dataTransfer.dropEffect = 'move' //增加图标
  }
  const dragover = (e) => {
    e.preventDefault()
  }
  const dragleave = (e) => {
    e.dataTransfer.dropEffect = 'none'
  }
  const drop = (e) => {

    let blocks = data.value.blocks  //内部已经渲染的组件
    data.value = {
      ...data.value,
      blocks: [
        ...blocks,
        {
          top: e.offsetY,
          left: e.offsetX,
          zIndex: 1,
          key: currentComponent.key,
          alignCenter: true,//希望松手的时候可以居中
          props: {},
          model: {}
        }
      ]
    }
    currentComponent = null
  }
  const dragstart = (e, component) => {
    //dragEnter  进入元素 添加一个移动的标识
    //dragOver   在目标元素中经过 必须要阻止默认事件 否则不能触发drop事件
    //dragleave  离开元素 增加一个禁用标识
    //drop 松开的时候，添加一个组件
    containerRef.value.addEventListener('dragenter', dragenter)
    containerRef.value.addEventListener('dragover', dragover)
    containerRef.value.addEventListener('dragleave', dragleave)
    containerRef.value.addEventListener('drop', drop)
    currentComponent = component
    //拖拽之前发布事件
    events.emit('start')
  }

  const dragend = (e) => {
    containerRef.value.removeEventListener('dragenter', dragenter)
    containerRef.value.removeEventListener('dragover', dragover)
    containerRef.value.removeEventListener('dragleave', dragleave)
    containerRef.value.removeEventListener('drop', drop)

    //拖拽结束发布事件
    events.emit('end')
  }

  return {
    dragstart,
    dragend
  }
}