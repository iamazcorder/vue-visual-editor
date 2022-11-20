import { reactive } from "vue"
import { events } from "./events"

export function useBLockDragger(focusData, lastSelectBlock, data) {
  let dragState = {
    startX: 0,
    startY: 0,
    dragging: false  //默认不是在拖拽
  }
  let markLine = reactive({
    x: null,
    y: null
  })
  const mousemove = (e) => {
    let { clientX: moveX, clientY: moveY } = e

    //当前正在拖
    if (!dragState.dragging) {
      dragState.dragging = true
      //触发事件  就会记住触发前的位置
      events.emit('start')
    }

    //计算当前元素最新的Left和top，去lines数组里面找是否有符合的
    //(鼠标移动后-鼠标移动前) =>鼠标移动位置 +元素最初的left
    let left = moveX - dragState.startX + dragState.startLeft
    let top = moveY - dragState.startY + dragState.startTop


    //显示横线  当top跟lines数组中的top差值小于5px的时候，就显示这根线
    let y = null
    for (let i = 0; i < dragState.lines.y.length; i++) {
      const { top: t, showTop: s } = dragState.lines.y[i]
      if (Math.abs(top - t) < 5) {  //显示这根线
        y = s//线显示的位置

        //接近的时候两个元素之间快速贴合
        moveY = dragState.startY - dragState.startTop + t


        break
      }
    }

    //显示竖线
    let x = null
    for (let i = 0; i < dragState.lines.x.length; i++) {
      const { left: l, showLeft: s } = dragState.lines.x[i]
      if (Math.abs(left - l) < 5) {  //显示这根线
        x = s//线显示的位置

        //接近的时候两个元素之间快速贴合
        moveX = dragState.startX - dragState.startLeft + l

        break
      }
    }

    //响应式数据，x和y更新了会导致视图更新
    markLine.x = x
    markLine.y = y

    //更新选中元素的位置
    let durX = moveX - dragState.startX  //横向移动的距离
    let durY = moveY - dragState.startY  //纵向移动的距离

    focusData.value.focus.forEach((block, index) => {
      block.top = dragState.startPos[index].top + durY
      block.left = dragState.startPos[index].left + durX
    })
  }
  const mouseup = (e) => {
    document.removeEventListener('mousemove', mousemove)
    document.removeEventListener('mouseup', mouseup)
    markLine.x = null
    markLine.y = null
    if (dragState.dragging) {
      events.emit('end')
    }
  }
  const mousedown = (e) => {
    const { width: BWidth, height: BHeight } = lastSelectBlock.value
    dragState = {
      //记录刚点击的时候鼠标的位置
      startX: e.clientX,
      startY: e.clientY,

      //只是点击,不是在拖拽
      dragging: false,

      //记录刚点击的时候被点击元素的位置
      startLeft: lastSelectBlock.value.left,
      startTop: lastSelectBlock.value.top,

      //记录每一个选中所在的位置
      startPos: focusData.value.focus.map(({ top, left }) => ({ top, left })),
      lines: (() => {
        const { unfocused } = focusData.value  //获取其他没选中的以他们的位置做辅助线

        let lines = { x: [], y: [] }  //y用来存放所有横线的位置和拖动元素的位置  x用来存放所有竖线的位置和拖动元素的位置

        //最外面的容器也得作为参照物
        const unfocused1 = [...unfocused, {
          top: 0,
          left: 0,
          width: data.value.container.width,
          height: data.value.container.height
        }]
        unfocused1.forEach(block => {
          const { top: ATop, left: ALeft, width: AWidth, height: AHeight } = block

          //在移动B的时候就看B的top和left是否满足线出现的条件
          //-----------------横线Y
          //showTop是横线的位置，top是被拖动元素的top
          //顶（A不动元素）对顶（B拖动元素）
          lines.y.push({ showTop: ATop, top: ATop })
          // 顶对底
          lines.y.push({ showTop: ATop, top: ATop - BHeight })
          //中对中
          lines.y.push({ showTop: ATop + (AHeight / 2), top: ATop + (AHeight / 2) - (BHeight / 2) })
          //底对顶
          lines.y.push({ showTop: ATop + AHeight, top: ATop + AHeight })
          //底对底
          lines.y.push({ showTop: ATop + AHeight, top: ATop + AHeight - BHeight })

          //-------------------竖线
          //左对左
          lines.x.push({ showLeft: ALeft, left: ALeft })
          //左对右
          lines.x.push({ showLeft: ALeft, left: ALeft - BWidth })
          //中对中
          lines.x.push({ showLeft: ALeft + (AWidth / 2), left: ALeft + (AWidth / 2) - (BWidth / 2) })
          //右对右
          lines.x.push({ showLeft: ALeft + AWidth, left: ALeft + AWidth - BWidth })
          //右对左
          lines.x.push({ showLeft: ALeft + AWidth, left: ALeft + AWidth })
        })
        return lines
      })()
    }
    document.addEventListener('mousemove', mousemove)
    document.addEventListener('mouseup', mouseup)

  }

  return {
    mousedown,
    markLine
  }
}