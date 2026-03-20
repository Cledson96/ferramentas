---
name: design-system
description: "Regras de uso do @juscash/design-system — componentes, icones LucideIcons e mapeamento Figma para codigo. Ativar automaticamente ao implementar telas, componentes UI ou receber link do Figma."
user-invocable: false
---

# Skill: Design System

Garante que toda implementação de UI use os componentes da biblioteca `@juscash/design-system`, especialmente ao trabalhar com Figma.

## Quando ativar

Esta skill deve ser seguida SEMPRE que o Claude for:
- Implementar uma tela, página ou componente de UI
- Receber um link do Figma para implementar
- Criar ou modificar componentes React

Não precisa executar `/design-system` — essas regras devem estar ativas automaticamente.

---

## Regras obrigatórias

### 1. Sempre importar de `@juscash/design-system`

```tsx
// CORRETO
import { Button, Input, Table, Modal } from '@juscash/design-system'

// ERRADO — nunca fazer isso
import { Button } from 'antd'
```

### 2. Ícones sempre de LucideIcons

```tsx
// CORRETO
import { LucideIcons } from '@juscash/design-system'
const { Search, Plus, Trash2 } = LucideIcons

// ERRADO
import { SearchOutlined } from '@ant-design/icons'
```

### 3. Componentes customizados disponíveis

Estes 30 componentes têm customizações visuais da JusCash. **Usar obrigatoriamente** em vez do antd:

| Componente | Uso |
|------------|-----|
| `Alert` | Alertas e avisos |
| `Avatar` | Foto/iniciais de usuário |
| `Badge` | Contadores e indicadores |
| `Breadcrumb` | Navegação de caminho |
| `Button` | Botões (primário, secundário, etc.) |
| `Card` | Cards e painéis |
| `Carousel` | Carrossel de conteúdo |
| `Checkbox` | Caixas de seleção |
| `Collapse` | Acordeão/expandir |
| `ConfirmModal` | Modal de confirmação (sim/não) |
| `DatePicker` | Seletor de data |
| `Drawer` | Painel lateral |
| `FormItem` | Item de formulário (label + input + validação) |
| `Input` | Campos de texto |
| `Loading` | Indicador de carregamento |
| `Modal` | Modais genéricos |
| `Notification` | Notificações toast |
| `PageHeader` | Cabeçalho de página com título e ações |
| `Popover` | Popover flutuante |
| `Radio` | Botões de rádio |
| `Segmented` | Controle segmentado (tabs inline) |
| `Select` | Dropdown de seleção |
| `Skeleton` | Placeholder de carregamento |
| `Switch` | Toggle on/off |
| `Table` | Tabelas de dados |
| `Tabs` | Abas de navegação |
| `Tag` | Etiquetas/labels |
| `Tooltip` | Dica ao passar o mouse |
| `Typography` | Textos (Title, Text, Paragraph) |
| `Upload` | Upload de arquivos |

### 4. Componentes re-exportados do antd

Estes componentes são re-exportados do antd via design-system. Importar sempre do design-system:

`Layout`, `Grid`, `Row`, `Col`, `Space`, `Divider`, `Flex`, `Form`, `Menu`, `Pagination`, `Steps`, `Anchor`, `InputNumber`, `TreeSelect`, `Cascader`, `TimePicker`, `Calendar`, `Transfer`, `Slider`, `Rate`, `Mentions`, `AutoComplete`, `ColorPicker`, `Progress`, `Tree`, `Timeline`, `Descriptions`, `Empty`, `Image`, `List`, `Statistic`, `QRCode`, `Popconfirm`, `Spin`, `Result`, `FloatButton`, `Affix`, `Dropdown`, `Watermark`, `Tour`, `message`, `notification`

---

## Instruções para o Claude

### Quando receber um link do Figma

1. **Extrair o design**: usar MCP Figma `get_design_context` com o `fileKey` e `nodeId` do link
   - URL format: `https://figma.com/design/:fileKey/:fileName?node-id=:nodeId`
   - Extrair `fileKey` e converter `nodeId` de `1-2` para `1:2`

2. **Analisar o screenshot**: identificar cada elemento visual na tela:
   - Botões, inputs, tabelas, modais, cards, etc.
   - Layout: flex, grid, espaçamentos
   - Cores, tipografia, ícones

3. **Mapear para componentes do Design System**:
   - Cada elemento visual → componente correspondente da tabela acima
   - Se o Figma usar um componente que não existe no design-system, implementar como styled component seguindo os tokens visuais

4. **Gerar código**:
   - Imports de `@juscash/design-system`
   - Respeitar espaçamentos e layout do Figma
   - Usar tokens do theme quando possível

5. **Validar**: usar `get_screenshot` do MCP Figma para comparar visualmente

### Quando criar UI sem Figma

1. Perguntar se há design no Figma para a tela
2. Se não houver, usar os componentes do design-system seguindo padrões do Storybook
3. Referência visual: https://juscash.github.io/design-system/

### Exemplo de implementação

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
  LucideIcons
} from '@juscash/design-system'

const { Search, Plus, Filter } = LucideIcons

export function UserListPage() {
  return (
    <>
      <PageHeader
        title="Usuários"
        extra={<Button type="primary" icon={<Plus />}>Novo Usuário</Button>}
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

## Referências

- **Repo**: https://github.com/Juscash/design-system
- **Storybook**: https://juscash.github.io/design-system/
- **Pacote**: `@juscash/design-system` (GitHub Packages @juscash scope)
- **Base**: Ant Design 6 + tokens visuais JusCash
- **Ícones**: Lucide React via `LucideIcons`
