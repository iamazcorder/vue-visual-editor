import { computed, ref } from "vue"

export function useFocus(data, previewRef, callback) {
  const selectIndex = ref(-1) //记录最后点击的组件的索引
  const lastSelectBlock = computed(() => {  //记录最后点击的组件
    return data.value.blocks[selectIndex.value]
  })

  //记录选中和没有选中的元素
  const focusData = computed(() => {
    let focus = []
    let unfocused = []
    data.value.blocks.forEach(block => {
      block.focus ? focus.push(block) : unfocused.push(block)
    })
    return {
      focus,
      unfocused
    }
  })

  //将所有的block.focus设为false
  const clearBlockFocus = () => {
    data.value.blocks.forEach(block => {
      block.focus = false
    })
  }
  const blockMousedown = (e, block, index) => {
    if (previewRef.value) {
      return
    }
    e.preventDefault()
    e.stopPropagation()
    //在block上定义一个属性focus， 获取焦点后就就将focus变为true
    //判断是否按下了shift  实现多选效果
    if (e.shiftKey) {
      if (focusData.value.focus.length <= 1) {
        block.focus = true
      } else {
        block.focus = !block.focus
      }

    } else if (!block.focus) {
      clearBlockFocus()
      block.focus = true  //清空其他人
    } //当自己已经被选中了，再次点击就不会取消选择，只有点击外面元素才能取消选中

    selectIndex.value = index  //不断记录当前最后被点击的元素
    callback(e)
  }


  //点击外面的盒子，能够取消掉选中
  const containerMousedown = (e) => {
    if (previewRef.value) {
      return
    }
    clearBlockFocus()
    selectIndex.value = -1
  }


  return {
    focusData,
    blockMousedown,
    containerMousedown,
    lastSelectBlock,
    clearBlockFocus
  }
}