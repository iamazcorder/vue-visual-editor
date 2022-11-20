import { ElDialog, ElInput, ElButton } from "element-plus";
import { createVNode, defineComponent, reactive, render } from "vue";

const DialogComponent = defineComponent({
  props: {
    options: {
      type: Object
    }
  },
  setup(props, ctx) {
    const state = reactive({
      isShow: false,
      options: props.options  //用户传入的属性
    })

    //在全局暴露出修改对话框显示或者隐藏的方法
    ctx.expose({
      showDialog(options) {
        //更新用户传入的属性，保证每次都是最新的
        state.options = options
        state.isShow = true
      }
    })
    const onCancel = () => {
      state.isShow = false
    }
    const onConfirm = () => {
      state.isShow = false
      state.options.onConfirm && state.options.onConfirm(state.options.content)
    }
    const render = () => {
      return <ElDialog v-model={state.isShow} title={state.options.title}>
        {{
          default: () => <ElInput
            type="textarea"
            v-model={state.options.content}
            rows={10}
          ></ElInput>,
          footer: () => state.options.footer && <div>
            <ElButton onClick={onConfirm}>确定</ElButton>
            <ElButton type="primary" onClick={onCancel}>取消</ElButton>
          </div>
        }
        }
      </ElDialog >
    }

    return render
  }
})

let vm = null
export function $dialog(options) {
  //手动挂载组件

  //不需要多次重复创建
  if (!vm) {
    //1. 创建一个div元素
    let el = document.createElement('div')

    //2. 得到组件的虚拟节点
    vm = createVNode(DialogComponent, { options })

    //3. 把虚拟节点变成真实节点, 将真实节点渲染到div元素上
    render(vm, el)

    //4. 将div 渲染到页面上
    document.body.appendChild(el)
  }

  //得到显示对话框的方法
  let { showDialog } = vm.component.exposed
  showDialog(options)
}

