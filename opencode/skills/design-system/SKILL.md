---
name: design-system
description: "Regras de uso do @juscash/design-system para UI: componentes, icones LucideIcons e implementacao a partir de Figma. Use ao criar ou alterar telas, componentes React ou qualquer fluxo de interface."
---

# Skill: Design System

Garante que toda implementacao de UI use os componentes da biblioteca `@juscash/design-system`, especialmente ao trabalhar com Figma.

## Quando ativar

Esta skill deve ser seguida sempre que o agente for:
- Implementar uma tela, pagina ou componente de UI
- Receber um link do Figma para implementar
- Criar ou modificar componentes React

Nao precisa carregar esta skill manualmente quando o contexto ja for de UI.

---

## Regras obrigatorias

### 1. Sempre importar de `@juscash/design-system`

```tsx
// CORRETO
import { Button, Input, Table, Modal } from '@juscash/design-system'

// ERRADO - nunca fazer isso
import { Button } from 'antd'
```

### 2. Icones sempre de LucideIcons

```tsx
// CORRETO
import { LucideIcons } from '@juscash/design-system'
const { Search, Plus, Trash2 } = LucideIcons

// ERRADO
import { SearchOutlined } from '@ant-design/icons'
```

### 3. Componentes customizados disponiveis

Estes componentes tem customizacoes visuais da JusCash. Usar obrigatoriamente em vez do antd:

`Alert`, `Avatar`, `Badge`, `Breadcrumb`, `Button`, `Card`, `Carousel`, `Checkbox`, `Collapse`, `ConfirmModal`, `DatePicker`, `Drawer`, `FormItem`, `Input`, `Loading`, `Modal`, `Notification`, `PageHeader`, `Popover`, `Radio`, `Segmented`, `Select`, `Skeleton`, `Switch`, `Table`, `Tabs`, `Tag`, `Tooltip`, `Typography`, `Upload`

### 4. Componentes reexportados do antd

Importar sempre do design-system:

`Layout`, `Grid`, `Row`, `Col`, `Space`, `Divider`, `Flex`, `Form`, `Menu`, `Pagination`, `Steps`, `Anchor`, `InputNumber`, `TreeSelect`, `Cascader`, `TimePicker`, `Calendar`, `Transfer`, `Slider`, `Rate`, `Mentions`, `AutoComplete`, `ColorPicker`, `Progress`, `Tree`, `Timeline`, `Descriptions`, `Empty`, `Image`, `List`, `Statistic`, `QRCode`, `Popconfirm`, `Spin`, `Result`, `FloatButton`, `Affix`, `Dropdown`, `Watermark`, `Tour`, `message`, `notification`

---

## Instruções

### Quando receber um link do Figma

1. Extrair o design com `get_design_context` usando `fileKey` e `nodeId`.
2. Analisar screenshot e mapear cada elemento para o componente correspondente.
3. Se o Figma usar um componente que nao existe no design-system, implementar como styled component seguindo os tokens visuais.
4. Gerar codigo com imports de `@juscash/design-system`.
5. Validar visualmente com `get_screenshot` do MCP Figma.

### Quando criar UI sem Figma

1. Perguntar se ha design no Figma para a tela.
2. Se nao houver, usar os componentes do design-system seguindo padroes do Storybook.
3. Referencia visual: https://juscash.github.io/design-system/

### Exemplo de implementacao

```tsx
import {
  Button,
  Input,
  Table,
  PageHeader,
  Tag,
  Card,
  FormItem,
  Form,
  Select,
  LucideIcons,
} from '@juscash/design-system'

const { Search, Plus, Filter } = LucideIcons

export function UserListPage() {
  return (
    <>
      <PageHeader
        title="Usuarios"
        extra={<Button type="primary" icon={<Plus />}>Novo Usuario</Button>}
      />
      <Card>
        <Form layout="inline">
          <FormItem label="Buscar">
            <Input prefix={<Search size={16} />} placeholder="Nome ou email" />
          </FormItem>
          <FormItem label="Status">
            <Select options={[{ label: 'Ativo', value: 'active' }]} />
          </FormItem>
        </Form>
        <Table
          columns={columns}
          dataSource={data}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </>
  )
}
```

---

## Referencias

- **Repo**: https://github.com/Juscash/design-system
- **Storybook**: https://juscash.github.io/design-system/
- **Pacote**: `@juscash/design-system`
- **Base**: Ant Design 6 + tokens visuais JusCash
- **Icones**: Lucide React via `LucideIcons`
