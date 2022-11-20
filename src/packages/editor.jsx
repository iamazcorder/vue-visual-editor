import { computed, defineComponent, inject, ref } from "vue";
import './editor.scss'
import EditorBlock from "./editor-block";
import { useMenuDragger } from './useMenuDragger.js'
import { useFocus } from "./useFocus";
import { useBLockDragger } from "./useBlockDragger";
import { useCommand } from "./useCommand";
import { $dialog } from "@/components/Dialog";
import { ElButton } from "element-plus";
import { $dropdown, DropdownItem } from "@/components/Dropdown";
import EditorOperator from "./editor-operator";

export default defineComponent({
  props: {
    modelValue: {
      type: Object,
    },
    formData: {
      type: Object
    }
  },
  emits: ['update:modelValue'],
  setup(props, ctx) {
    //预览的时候，组件不能再移动了   ，但是可以点击/输入内容 
    const previewRef = ref(false)
    //当前是否为编辑状态，如果是则正常显示，不是则是渲染页面的状态，只显示面板上的内容
    const editorRef = ref(true)

    const data = computed({
      get() {
        return props.modelValue
      },
      set(newValue) {
        ctx.emit('update:modelValue', newValue)
      }
    })

    //画布样式
    const containerStyles = computed(() => {
      return {
        width: data.value.container.width + 'px',
        height: data.value.container.height + 'px'
      }
    })

    //{componentList , componentMap , register} 注册的组件
    const config = inject('config')

    //组件要拖动到的中间画布的元素,给他绑定事件
    const containerRef = ref(null)

    //1. 实现菜单的拖拽功能
    const { dragstart, dragend } = useMenuDragger(data, containerRef)

    //2. 实现获取焦点的功能  => 选中之后可能就直接进行拖拽了
    //3. 实现多个元素拖拽

    //（1）处理选中之后直接拖拽
    let { focusData, blockMousedown, containerMousedown, lastSelectBlock, clearBlockFocus } = useFocus(data, previewRef, (e) => {
      //获取焦点之后进行拖拽
      mousedown(e)
    })
    let { mousedown, markLine } = useBLockDragger(focusData, lastSelectBlock, data)  //lastSelectBlock是辅助线的基准



    //4.按钮命令
    const { commands } = useCommand(data, focusData)

    //5. 快捷按钮
    //lebel 操作名称
    //icon 图标类名
    //handler 点击之后的处理函数
    const buttons = [
      { label: '撤销', icon: 'icon-back', handler: () => commands.undo() },
      { label: '重做', icon: 'icon-forward', handler: () => commands.redo() },
      //弹出对话框, 输入JSON数据，把JSON数据转化到画布上面
      {
        label: '导入', icon: 'icon-import', handler: () => {
          $dialog({
            title: '导入JSON使用',
            content: '',
            footer: true,
            onConfirm: (text) => {
              //data.value = JSON.parse(text)  //这样更改无法保留历史记录
              commands.updateContainer(JSON.parse(text))
            }
          })
        }
      },
      //弹出对话框, 把组件转化为json数据进行渲染
      {
        label: '导出', icon: 'icon-export', handler: () => {
          $dialog({
            title: '导出JSON使用',
            content: JSON.stringify(data.value),
            footer: true
          })
        }
      },
      //置顶
      { label: '置顶', icon: 'icon-place-top', handler: () => commands.placeTop() },
      { label: '置底', icon: 'icon-place-bottom', handler: () => commands.placeBottom() },
      { label: '删除', icon: 'icon-delete', handler: () => commands.delete() },
      {
        label: () => previewRef.value ? '编辑' : '预览',
        icon: () => previewRef.value ? 'icon-edit' : 'icon-browse',
        handler: () => {
          previewRef.value = !previewRef.value
          clearBlockFocus()
        }
      },
      {
        label: '关闭', icon: 'icon-close', handler: () => {
          editorRef.value = false
          clearBlockFocus()
        }
      },

    ]

    //右键自定义菜单
    const onContextMenuBlock = (e, block) => {
      e.preventDefault() //阻止默认菜单

      //弹出自定义菜单
      $dropdown({
        el: e.target,
        content: () => {
          return <>
            <DropdownItem label="删除" icon="icon-delete" onClick={() => commands.delete()}></DropdownItem>
            <DropdownItem label="置顶" icon="icon-place-top" onClick={() => commands.placeTop()}></DropdownItem>
            <DropdownItem label="置底" icon="icon-place-bottom" onClick={() => commands.placeBottom()}></DropdownItem>
            <DropdownItem label="查看" icon="icon-browse" onClick={() => {
              $dialog({
                title: '查看JSON数据',
                content: JSON.stringify(block)
              })
            }}></DropdownItem>
            <DropdownItem label="导入" icon="icon-import" onClick={() => {
              $dialog({
                title: '导入JSON数据',
                content: '',
                footer: true,
                onConfirm: (text) => {
                  commands.updateBlock(JSON.parse(text), block)  //传入新的和旧的
                }
              })
            }}></DropdownItem>
          </>
        }
      })

    }


    const render = () => {
      return !editorRef.value ? <>
        <div class="editor-container-canvas-content"
          style={[containerStyles.value, "margin:0"]}
        >
          {
            (data.value.blocks.map((block, index) => {
              return <EditorBlock
                block={block}
                formData={props.formData}
                class={'editor-block-preview'}
              ></EditorBlock>
            }))
          }
        </div>
        <div><ElButton type="primary" onClick={() => editorRef.value = true}>继续编辑</ElButton></div>
      </>
        : <div class="editor">
          <div class="editor-left">
            {/* 根据注册列表，渲染对应的内容  可以实现拖拽*/}
            {config.componentList.map(component => {
              return <div class="editor-left-item"
                draggable
                onDragstart={e => dragstart(e, component)}
                onDragend={dragend}>
                <span>{component.label}</span>
                <div>{component.preview()}</div>
              </div>
            })}
          </div>
          <div class="editor-top">
            {
              buttons.map((btn, index) => {
                const icon = typeof btn.icon === 'function' ? btn.icon() : btn.icon
                const label = typeof btn.label === 'function' ? btn.label() : btn.label
                return <div class="editor-top-button" onClick={btn.handler}>
                  <i class={icon}></i>
                  <span>{label}</span>
                </div>
              })
            }
          </div>
          <div class="editor-right">
            <EditorOperator
              block={lastSelectBlock.value}
              data={data.value}
              updateContainer={commands.updateContainer}
              updateBlock={commands.updateBlock}
            ></EditorOperator>
          </div>
          <div class="editor-container">
            {/* 负责产生滚动条*/}
            <div class="editor-container-canvas">
              {/* 内容区域 */}
              <div class="editor-container-canvas-content"
                style={containerStyles.value}
                ref={containerRef}
                onMousedown={containerMousedown}
              >
                {
                  (data.value.blocks.map((block, index) => {
                    return <EditorBlock
                      block={block}
                      formData={props.formData}
                      onMousedown={e => blockMousedown(e, block, index)}
                      onContextmenu={(e) => onContextMenuBlock(e, block)}
                      class={[block.focus ? 'eidtor-block-focus' : '', previewRef.value ? 'editor-block-preview' : '']}
                    ></EditorBlock>
                  }))
                }
                {markLine.x !== null && <div class="line-x" style={{ left: markLine.x + 'px' }}></div>}
                {markLine.y !== null && <div class="line-y" style={{ top: markLine.y + 'px' }}></div>}

              </div>

            </div>
          </div>
        </div>
    }
    return render
  }
})