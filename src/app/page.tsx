import Image from 'next/image'
import styles from './page.module.css'
import { InitializeButton } from '@/components/InitializeButton'
import { WalletView } from '@/components/WalletView'
import { Layout, Space } from 'antd'
import { Content, Header } from 'antd/es/layout/layout'

export default function Home() {
  return (
    <Layout>
      <Header>Point</Header>
      <Content>
        <Space direction="horizontal" size="large">
          <span></span>
          <Space direction="vertical" size="middle">
            <div></div>
            <div>
              <InitializeButton/>
            </div>
            <div>
              <WalletView/>
            </div>
          </Space>
        </Space>
      </Content>
    </Layout>
  )
}
