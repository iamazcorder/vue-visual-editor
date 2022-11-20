import { computed, defineComponent, inject, onMounted, ref } from "vue";
import BlockResize from "./block-resize";
export default defineComponent({
  props: {
    block: {
      type: Object
    },
    formData: {
      type: Object
    }
  },
  setup(props) {
    const blockStyles = computed(() => {
      return {
        top: `${props.block.top}px`,
        left: `${props.block.left}px`,
        zIndex: `${props.block.zIndex}`,
      }
    })
    const config = inject('config')

    //获取渲染元素
    const blockRef = ref(null)
    //渲染完之后才能得到元素宽高    要居中
    onMounted(() => {
      let { offsetWidth, offsetHeight } = blockRef.value
      if (props.block.alignCenter) {  //拖拽松手的元素 在鼠标居中  其他默认在页面上渲染的不需要居中
        props.block.left = props.block.left - offsetWidth / 2
        props.block.top = props.block.top - offsetHeight / 2

        props.block.alignCenter = false
      }

      props.block.width = offsetWidth
      props.block.height = offsetHeight
    })

    const render = () => {
      //通过block的key属性获取对应的组件
      const component = config.componentMap[props.block.key]

      //获取组件的render函数
      const renderComponent = component.render({
        size: props.block.hasResize ? { width: props.block.width, height: props.block.height } : {},
        props: props.block.props,

        //model: props.block.model 
        // => {default: 'username'} 
        /* => { modelValue: FormData.username ,
            "onUpdate":modelValue:v=> FormData.username = v
        }   */

        model: Object.keys(component.model || {}).reduce((prev, modelName) => {
          let propName = props.block.model && props.block.model[modelName]
          prev[modelName] = {
            modelValue: props.formData[propName],
            "onUpdate:modelValue": v => props.formData[propName] = v
          }
          return prev
        }, {})
      })

      const { width, height } = component.resize || {}
      return <div class="editor-block" style={blockStyles.value} ref={blockRef}>
        {renderComponent}

        {/* 传递block的目的是为了修改当前block的宽高  传component是为了获取能修改宽度还是高度 */}
        {props.block.focus && (width || height) && <BlockResize
          block={props.block}
          component={component}
        ></BlockResize>}
      </div>
    }

    return render
  }
})