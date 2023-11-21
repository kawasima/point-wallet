"use client"

import { Wallet } from "@/lib/model"
import { Alert, Button, Form, InputNumber, List, Space } from "antd"
import { useEffect, useState } from "react"

type WalletViewProps = {
    walletId: string
}

function PointTransaction({ walletId, refreshFn}: { walletId: string, refreshFn: () => void }) {
    const [amount, setAmount] = useState<number>(0)
    const [messages, setMessages] = useState<string[]>([])

    const putPoint = (type: "aquisition" | "consumption") => {
        fetch(`/api/wallet/${walletId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                type,
                point: amount
            })
        }).then(res => {
            if (res.status !== 200) {
                res.json().then(data => setMessages(data.messages))
            } else {
                return res.json()
            }
        })
        .then(data => refreshFn())
    }

    const handleChangeAmount = (v: number | null) => {
        setMessages([])
        if (v != null) { setAmount(v) }
    }

    type FieldType = {
        amount: number;
    }

    return (
        <Form labelCol={{ span:8 }} wrapperCol={{ span: 16 }}>
            <Space direction="vertical" size="middle">
            <Form.Item<FieldType> name="amount" label="ポイント">
                <InputNumber<number> onChange={handleChangeAmount}
                    addonAfter={"ポイント"}/>
            </Form.Item>
            <Space direction="horizontal" size="middle">
                <Button type="primary" onClick={_ => putPoint("aquisition")}>付与</Button>
                <Button type="primary" onClick={_ => putPoint("consumption")}>使用</Button>
            </Space>
            { messages.length > 0 && <Alert message={messages.join("\n")} type="error" showIcon/>}
            </Space>
        </Form>)
}
function WalletDetail({ walletId }: WalletViewProps) {
    const [wallet, setWallet] = useState<Wallet | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)
    useEffect(() => {
        fetch(`/api/wallet/${walletId}?with=pointsCloseToExpiry`)
            .then(response => response.json())
            .then(data => setWallet(Wallet.parse(data)))
    }, [refreshKey])
    return (
        <>
            { wallet && <h2>現在の保有残高: <span>{wallet.balance}</span></h2>}
            <PointTransaction walletId={walletId} refreshFn={() => setRefreshKey(refreshKey + 1)}/>
            { wallet?.transactions && <h3>取引履歴</h3>}
            <List size="small" bordered dataSource={wallet?.transactions}
                renderItem={item => (<List.Item>
                    <Space>
                        <span>{item.transactedAt.toISOString()}</span>
                        <span>{item.amount}</span>
                        <span>{item.type === "aquisition" ? "獲得" : "使用"}</span>
                    </Space>
                </List.Item>)}/>
            { wallet?.pointsCloseToExpiry && <h3>まもなく有効期限の切れるポイント</h3>}
            <List size="small" bordered dataSource={wallet?.pointsCloseToExpiry}
                renderItem={item => (<List.Item>
                    <Space>
                        <span>{item.expiresOn.toISOString()}</span>
                        <span>{item.amount}</span>
                    </Space>
                </List.Item>)}/>
        </>
    )
}

export function WalletView() {
    const [walletId, setWalletId] = useState(null)
    function handleClick() {
        fetch("/api/wallets", {
            method: "POST",
        }).then(response => response.json())
        .then(data => setWalletId(data.walletId))
    }

    return walletId ?
        <WalletDetail walletId={walletId}/>
        :
        (
            <div>
                <Button type="primary" onClick={handleClick}>Wallet作成</Button>
            </div>
        )
}