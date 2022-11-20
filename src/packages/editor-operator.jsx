import deepcopy from "deepcopy";
import { ElForm, ElFormItem, ElButton, ElInputNumber, ElInput, ElColorPicker, ElSelect, ElOption } from "element-plus";
import { defineComponent, inject, reactive, watch } from "vue";
import tableEditor from "./table-editor";

export default defineComponent({
  //如果有block就显示block的内容   没有则显示data
  props: {
    block: {  //用户最后选中的元素
      type: Object
    },
    data: {   //所有数据
      type: Object
    },
    updateContainer: {
      type: Function
    },
    updateBlock: {
      type: Function
    }
  },
  setup(props, ctx) {
    //所有配置信息（componentList componnetMap register）
    const config = inject('config')
    const state = reactive({
      editData: {}
    })

    //重置操作，恢复为原来的数据 (页面刚渲染就是原来的数据)
    const reset = () => {
      if (!props.block) { //没有点击元素，绑定的是容器的宽高
        state.editData = deepcopy(props.data.container)
      } else {
        state.editData = deepcopy(props.block)
      }
    }

    //将用户填写的属性让组件真正渲染出来
    const apply = () => {
      if (!props.block) {
        props.updateContainer({ ...props.data, container: state.editData })  //修改 data.value
      } else {
        props.updateBlock(state.editData, props.block)   //修改 data.value.blocks
      }
    }

    //监控是否有block
    watch(() => props.block, reset, { immediate: true })  //立刻就会触发一次

    const render = () => {
      let content = []
      if (!props.block) {
        content.push(<>
          <ElFormItem label="容器宽度">
            <ElInputNumber v-model={state.editData.width}></ElInputNumber>
          </ElFormItem>
          <ElFormItem label="容器高度">
            <ElInputNumber v-model={state.editData.height}></ElInputNumber>
          </ElFormItem>
        </>)
      } else {
        let component = config.componentMap[props.block.key]
        //处理容器  文本  按钮
        if (component && component.props) {
          content.push(Object.entries(component.props).map(([propName, propConfig]) => {
            return <ElFormItem label={propConfig.label}>
              {{
                input: () => <ElInput v-model={state.editData.props[propName]}></ElInput>,
                color: () => <ElColorPicker v-model={state.editData.props[propName]}></ElColorPicker>,
                select: () => <ElSelect v-model={state.editData.props[propName]}>
                  {
                    propConfig.options.map(opt => {
                      return <ElOption label={opt.label} value={opt.value}></ElOption>
                    })
                  }
                </ElSelect>,
                table: () => <tableEditor propConfig={propConfig} v-model={state.editData.props[propName]}></tableEditor>
              }[propConfig.type]()}
            </ElFormItem>
          }))
        }

        //处理输入框
        if (component && component.model) {
          content.push(Object.entries(component.model).map(([modelName, label]) => {
            return <ElFormItem label={label}>
              <ElInput v-model={state.editData.model[modelName]}></ElInput>
            </ElFormItem>
          }))
        }
      }



      return <ElForm labelPosition="top">
        {content}
        <ElFormItem>
          <ElButton type="primary" onClick={() => apply()}>应用</ElButton>
          <ElButton onClick={() => reset()}>重置</ElButton>

        </ElFormItem>

      </ElForm>
    }


    return render
  }
})