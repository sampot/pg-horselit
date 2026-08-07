# pg-horselit

復古**賽馬機**瀏覽器小品（機台感六軌燈光）：押注 → 開跑 → 結算。純娛樂、無真實金錢／兌現。

- **音效：** Web Audio 即時合成（投幣／押注／賽道節拍／中獎），無商業機台取樣  
- **賽道：** 六匹原創馬名並排燈軌，隨機速度動畫，先到終點者勝  
- **賠率：** 1–6 號為 ×2／×3／×4／×5／×6／×8（公平隨機勝者，不依押注加權）  

也可當作 [Playgrounds（遊樂場）](https://play.samkuo.me/) 的 **SAM**（`index.html` 入口）。手感想再調？開進來玩，再叫 AI 幫你改一版。

## 一鍵開 SAM 小

**[一鍵開 SAM 小](https://play.samkuo.me/?open=sampot%2Fpg-horselit&name=%E8%B3%BD%E9%A6%AC%E6%A9%9F)**

```
https://play.samkuo.me/?open=sampot/pg-horselit&name=賽馬機
```

同源會重用本機已匯入的沙盒；要強制新建可加 `&fresh=1`。

## 試玩（本機）

```bash
npx --yes serve .
# 或
python3 -m http.server 8080
```

瀏覽器需允許音訊（點一下頁面後音效才會出聲）。

## 操作

| 操作 | 說明 |
| --- | --- |
| **+50 幣** | 增加娛樂幣（開局 100） |
| 點馬號 | 每點押 1 幣，可押多匹 |
| **開跑** | 燈光賽道動畫後結算（賠付＝押注 × 賠率） |
| **撤銷押注** | 退回本局未開跑的押注 |
| **音效開／關** | 靜音切換 |

六軌燈光與馬名為本專案原創配置，僅向「賽馬機／燈光賽馬」類型致敬，不還原任何特定商業機台。

## 檔案

| 檔案 | 說明 |
| --- | --- |
| `index.html` | 結構 |
| `styles.css` | 亮／暗色主題、機台感版面 |
| `app.js` | UI 與賽道動畫 |
| `game.js` | 押注／賠率／結算 |
| `audio.js` | Web Audio 合成音效 |
| `functions.js` | Playgrounds 可選 stub |

## License

MIT
