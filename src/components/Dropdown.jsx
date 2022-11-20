import { ElMenu } from "element-plus"
import { computed, createVNode, defineComponent, inject, onBeforeUnmount, onMounted, provide, reactive, ref, render } from "vue"


export const DropdownItem = defineComponent({
  props: {
    label: {
      type: String
    },
    icon: {
      type: String
    }
  },
  setup(props) {
    let { label, icon } = props

    let hide = inject('hide')
    const render = () => {
      return <div class="dropdown-item" onClick={hide}>
        <i class={icon}></i>
        <span>{label}</span>
      </div>
    }


    return render
  }
})

const DropdownComponent = defineComponent({
  props: {
    options: {
      type: Object
    }
  },
  setup(props, ctx) {
    const state = reactive({
      isShow: false,
      options: props.options,
      top: 0,
      left: 0
    })

    ctx.expose({
      showDropdown(options) {
        state.isShow = true
        state.options = options
        let { top, left, height } = options.el.getBoundingClientRect()
        state.left = left
        state.top = top + height
      }
    })

    provide('hide', () => {
      state.isShow = false
    })

    const classes = computed(() => [
      'dropdown',
      {
        'dropdown-isShow': state.isShow
      }
    ])

    const styles = computed(() => {
      return {
        top: state.top + 'px',
        left: state.left + 'px'
      }
    })

    const el = ref(null)
    const onMouseDocument = (e) => {
      //判断点击的是菜单外面还是菜单里面
      if (!el.value.contains(e.target)) {
        state.isShow = false
      }
    }

    //监听文档点击事件，点击了就挺惨菜单
    onMounted(() => {
      document.body.addEventListener('mousedown', onMouseDocument, true)
    })

    //解绑事件
    onBeforeUnmount(() => {
      document.body.removeEventListener('mousedown', onMouseDocument)
    })


    const render = () => {
      return <div class={classes.value} style={styles.value} ref={el}>
        {state.options.content()}
      </div>
    }
    return render
  }
})

let vm = null
export function $dropdown(options) {


  if (!vm) {
    //1.创建一个div
    const el = document.createElement('div')

    //2. 创建组件的虚拟节点
    vm = createVNode(DropdownComponent, { options })

    //3. 将组件的虚拟节点渲染到div上面
    render(vm, el)


    //4. 将div渲染到页面上
    document.body.appendChild(el)
  }


  let { showDropdown } = vm.component.exposed
  showDropdown(options)
}