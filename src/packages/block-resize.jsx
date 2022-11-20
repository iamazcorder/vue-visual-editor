import { defineComponent } from "vue";

export default defineComponent({
  props: {
    block: {
      type: Object
    },
    component: {
      type: Object
    }
  },
  setup(props) {

    //保存初始数据
    let data = {}

    //把事件解绑
    const onmouseup = (e) => {
      document.body.removeEventListener('mousemove', onmousemove)
      document.body.removeEventListener('mouseup', onmouseup)
    }

    const onmousemove = (e) => {
      let { clientX, clientY } = e
      let { startX, startY, startWidth, startHeight, startLeft, startTop, direction } = data

      //拖水平中间 宽度不能改变
      if (direction.horizontal == 'center') {
        clientX = startX
      }

      //拖垂直中间  高度不能改变
      if (direction.vertical === 'center') {
        clientY = startY
      }

      //计算移动的距离，求出移动后的宽高
      let durX = clientX - startX
      let durY = clientY - startY

      //如果移动的是开始点，则应该改变 left 和 top （左边 左上 左下 上边）
      if (direction.vertical == 'start') {
        durY = -durY
        props.block.top = startTop - durY
      }

      if (direction.horizontal == 'start') {
        durX = -durX
        props.block.left = startLeft - durX
      }

      const width = startWidth + durX
      const height = startHeight + durY

      //更新block的宽高
      props.block.width = width
      props.block.height = height
      props.block.hasResize = true
    }
    const onmousedown = (e, direction) => {
      e.stopPropagation()

      //保存拖拽之前的信息
      data = {
        startX: e.clientX,
        startY: e.clientY,
        startWidth: props.block.width,
        startHeight: props.block.height,
        startLeft: props.block.left,
        startTop: props.block.top,
        direction
      }

      document.body.addEventListener('mousemove', onmousemove)
      document.body.addEventListener('mouseup', onmouseup)

    }
    const render = () => {
      const { width, height } = props.component.resize || {}
      return <>
        {width && <>
          <div class="block-resize block-resize-left" onMousedown={e => onmousedown(e, {
            horizontal: 'start',
            vertical: 'center'
          })}></div>
          <div class="block-resize block-resize-right" onMousedown={e => onmousedown(e, {
            horizontal: 'end',
            vertical: 'center'
          })}></div>
        </>}

        {height && <>
          <div class="block-resize block-resize-top" onMousedown={e => onmousedown(e, {
            horizontal: 'center',
            vertical: 'start'
          })}></div>
          <div class="block-resize block-resize-bottom" onMousedown={e => onmousedown(e, {
            horizontal: 'center',
            vertical: 'end'
          })}></div>
        </>}

        {width && height && <>
          <div class="block-resize block-resize-top-left" onMousedown={e => onmousedown(e, {
            horizontal: 'start',
            vertical: 'start'
          })}></div>
          <div class="block-resize block-resize-top-right" onMousedown={e => onmousedown(e, {
            horizontal: 'end',
            vertical: 'start'
          })}></div>
          <div class="block-resize block-resize-bottom-left" onMousedown={e => onmousedown(e, {
            horizontal: 'start',
            vertical: 'end'
          })}></div>
          <div class="block-resize block-resize-bottom-right" onMousedown={e => onmousedown(e, {
            horizontal: 'end',
            vertical: 'end'
          })}></div>
        </>}
      </>
    }

    return render
  }
})