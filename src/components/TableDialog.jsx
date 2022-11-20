import deepcopy from "deepcopy";
import { ElDialog, ElButton, ElTable, ElTableColumn, ElInput } from "element-plus";
import { createVNode, defineComponent, reactive, render } from "vue";


const TableDialog = defineComponent({
  props: {
    options: {
      type: Object
    }
  },
  setup(props, ctx) {
    const state = reactive({
      isShow: false,
      options: props.options,
      editData: []
    })
    ctx.expose({
      show(options) {
        state.isShow = true  //修改显示状态
        state.options = options  //更新用户的配置
        state.editData = deepcopy(options.data)  //默认显示最初的数据
      }
    })

    const add = () => {
      state.editData.push({})
    }

    const onCancel = () => {
      state.isShow = false
    }

    const onConfirm = () => {
      state.options.onConfirm(state.editData)
      state.isShow = false
    }
    const render = () => {
      return <ElDialog v-model={state.isShow} title={state.options.config.label}>
        {{
          default: () => {
            return <div>
              <div><ElButton onClick={add}>添加</ElButton><ElButton>重置</ElButton></div>

              <ElTable data={state.editData}>
                <ElTableColumn type="index"></ElTableColumn>
                {state.options.config.table.options.map((item, index) => {
                  return <ElTableColumn label={item.label}>
                    {{
                      default: ({ row }) => <ElInput v-model={row[item.field]}></ElInput>
                    }}
                  </ElTableColumn>
                })}

                <ElTableColumn label="操作">
                  <ElButton type="danger">删除</ElButton>
                </ElTableColumn>
              </ElTable>
            </div>
          },
          footer: () => {
            return <>
              <ElButton onClick={onConfirm}>确认</ElButton>
              <ElButton onClick={onCancel}>取消</ElButton>
            </>
          }
        }}
      </ElDialog>
    }
    return render
  }
})

let vm;
export const $tableDialog = (options) => {
  if (!vm) {
    const el = document.createElement('div')

    vm = createVNode(TableDialog, { options })

    render(vm, el)

    document.body.appendChild(el)
  }

  let { show } = vm.component.exposed
  show(options)
}