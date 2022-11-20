import { $tableDialog } from "@/components/TableDialog";
import deepcopy from "deepcopy";
import { ElButton, ElTag } from "element-plus";
import { computed, defineComponent } from "vue";

export default defineComponent({
  props: {
    propConfig: {
      type: Object
    },
    modelValue: {
      type: Array
    }
  },
  emits: ['update:modelValue'],
  setup(props, ctx) {
    console.log(props.modelValue);
    const data = computed({
      get() {
        return props.modelValue || []
      },
      set(newValue) {
        ctx.emit('update:modelValue', deepcopy(newValue))
      }
    })


    const add = () => {
      $tableDialog({
        config: props.propConfig,
        data: data.value,
        onConfirm(value) {
          data.value = value  //点击确认，数据更新
          console.log(data)
        }
      })
    }

    const render = () => {
      return <div>
        {/* 如果下拉框没有任何数据，直接显示一个按钮即可 */}
        {(!data.value || data.value.length === 0) && <ElButton onClick={add}>添加</ElButton>}
        {(data.value || []).map(item => <ElTag onClick={add}>{item[props.propConfig.table.key]}</ElTag>)}
      </div>
    }


    return render
  }
})