import { Alert, Anchor, Button, FileButton, Group, Loader, Pagination, Table, Text, TextInput, Title } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { importKIF } from 'tsshogi'
import { useAuth } from '../hooks/useAuth'
import { saveKifu, useKifuList } from '../hooks/useKifus'
import { baseNameOf, readKifFile } from '../lib/kifFile'
import { headerOf } from '../lib/kifu'

export function KifuListPage() {
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const page = Number(params.get('page')) || 1
  const [debouncedSearch] = useDebouncedValue(search.trim(), 300)
  const { data, isPending, error } = useKifuList(debouncedSearch, page)
  const auth = useAuth()
  const user = auth.status === 'ready' ? auth.user : null

  const setSearch = (q: string) => setParams(q ? { q } : {}, { replace: true })
  const setPage = (p: number) => setParams({ ...(search && { q: search }), ...(p > 1 && { page: String(p) }) })

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={2}>棋譜一覧</Title>
        {user && <KifUploadButton />}
      </Group>
      <TextInput
        placeholder="タイトル・対局者で検索"
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        mb="md"
        maw={400}
      />
      {isPending && <Loader />}
      {error && (
        <Alert color="red" title="棋譜一覧を取得できません">
          {error.message}
        </Alert>
      )}
      {data && data.items.length === 0 && (
        <Text c="dimmed">{debouncedSearch ? '該当する棋譜はありません。' : '棋譜はまだありません。'}</Text>
      )}
      {data && data.items.length > 0 && (
        <>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>タイトル</Table.Th>
                <Table.Th>先手</Table.Th>
                <Table.Th>後手</Table.Th>
                <Table.Th>手数</Table.Th>
                <Table.Th>更新日時</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.items.map((kifu) => (
                <Table.Tr key={kifu.id}>
                  <Table.Td>
                    <Anchor component={Link} to={`/kifus/${kifu.id}`}>
                      {kifu.title}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>{kifu.sente}</Table.Td>
                  <Table.Td>{kifu.gote}</Table.Td>
                  <Table.Td>{kifu.move_count}</Table.Td>
                  <Table.Td>{new Date(kifu.updated).toLocaleString('ja-JP')}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <Group justify="space-between" mt="md">
            <Text size="sm" c="dimmed">
              全 {data.totalItems} 件
            </Text>
            {data.totalPages > 1 && <Pagination total={data.totalPages} value={page} onChange={setPage} />}
          </Group>
        </>
      )}
    </>
  )
}

function KifUploadButton() {
  const navigate = useNavigate()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File | null) => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const record = importKIF(await readKifFile(file))
      if (record instanceof Error) throw record
      const { sente, gote } = headerOf(record)
      const created = await saveKifu(undefined, record, sente || gote ? '' : baseNameOf(file.name))
      navigate(`/kifus/${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setUploading(false)
    }
  }

  return (
    <Group gap="sm">
      {error && (
        <Text size="sm" c="red">
          読み込めません: {error}
        </Text>
      )}
      <FileButton onChange={upload} accept=".kif,.kifu,.txt">
        {(props) => (
          <Button {...props} variant="light" loading={uploading}>
            KIF ファイルを開く
          </Button>
        )}
      </FileButton>
    </Group>
  )
}
