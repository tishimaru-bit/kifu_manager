import { Anchor, List, Paper, Stack, Text, Title } from '@mantine/core'

export const SOURCE_URL = 'https://github.com/tishimaru-bit/shogi-kifucho'

const libraries = [
  { name: 'shogiground', url: 'https://github.com/WandererXII/shogiground', license: 'GPL-3.0-or-later' },
  { name: 'shogiops', url: 'https://github.com/WandererXII/shogiops', license: 'GPL-3.0-or-later' },
  { name: 'tsshogi', url: 'https://github.com/sunfish-shogi/tsshogi', license: 'MIT' },
  { name: 'encoding-japanese', url: 'https://github.com/polygonplanet/encoding.js', license: 'MIT' },
  { name: 'React', url: 'https://github.com/facebook/react', license: 'MIT' },
  { name: 'Mantine', url: 'https://github.com/mantinedev/mantine', license: 'MIT' },
]

export function AboutPage() {
  return (
    <Stack p={{ base: 'xs', sm: 0 }}>
      <Title order={2}>このソフトウェアについて</Title>

      <Paper withBorder p="md">
        <Stack gap="xs">
          <Text fw={600}>将棋棋譜帳</Text>
          <Text size="sm">Copyright (C) 2026 tishimaru-bit</Text>
          <Text size="sm">
            本プログラムはフリーソフトウェアです。Free Software Foundation が公表した GNU General Public License
            バージョン 3、またはそれ以降のバージョンの条件の下で再頒布・改変できます。
          </Text>
          <Text size="sm">
            本プログラムは有用であることを願って頒布されますが、商品性や特定目的への適合性の暗黙の保証も含め、
            いかなる保証もありません。詳しくは GNU General Public License を参照してください。
          </Text>
          <List size="sm">
            <List.Item>
              ソースコード: <Anchor href={SOURCE_URL}>{SOURCE_URL}</Anchor>
            </List.Item>
            <List.Item>
              ライセンス全文: <Anchor href="https://www.gnu.org/licenses/gpl-3.0.html">GNU GPL v3</Anchor>
            </List.Item>
          </List>
        </Stack>
      </Paper>

      <Paper withBorder p="md">
        <Stack gap="xs">
          <Text fw={600}>使用しているソフトウェア</Text>
          <List size="sm">
            {libraries.map((lib) => (
              <List.Item key={lib.name}>
                <Anchor href={lib.url}>{lib.name}</Anchor>（{lib.license}）
              </List.Item>
            ))}
          </List>
          <Text size="sm">
            配信しているプログラムに含まれる全ライブラリのライセンス文:{' '}
            <Anchor href="/third-party-licenses.txt">third-party-licenses.txt</Anchor>
          </Text>
        </Stack>
      </Paper>

      <Paper withBorder p="md">
        <Stack gap="xs">
          <Text fw={600}>素材</Text>
          <Text size="sm">
            駒画像: <Anchor href="https://github.com/sunfish-shogi/shogi-images">sunfish-shogi/shogi-images</Anchor>{' '}
            の一字駒（<Anchor href="https://creativecommons.org/publicdomain/zero/1.0/">CC0 1.0</Anchor>）
          </Text>
        </Stack>
      </Paper>
    </Stack>
  )
}
