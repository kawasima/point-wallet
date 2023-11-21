"use client"

import { Button } from "antd"
import { useEffect, useState } from "react"

export function InitializeButton() {
    const [initialized, setInitialized] = useState(false)
    useEffect(() => {
        fetch(`/api/initialize`)
            .then(res => res.json())
            .then(data => setInitialized(data.initialized))
    }, [])
    function handleClick() {
        fetch("/api/initialize", {
            method: "POST",
        }).then(response => response.json())
        .then(data => setInitialized(true))
    }
    return (
        <div>
            { !initialized && <Button type="text" danger onClick={handleClick}>データベース初期化</Button> }
        </div>
    )
}