# SOCIAL EDITORIAL BATCH E AUDIT

## Scope

本報告只檢查 Batch E 的 12 筆 approved practice source（Lesson 31–36，P6/P7）及 Lesson 32、36 Gold teaching replacements。未執行 import；未修改 canonical lesson、practice、runtime、UI 或 audit scripts。

## Practice audit

| ID | Target aligned | Spatial logic | Map/scale | Evidence | Single best answer | Command/rubric | PASS |
|---|---|---|---|---|---|---|---|
| L31-P6 | PASS | PASS | PASS | PASS | PASS | N/A | PASS |
| L31-P7 | PASS | PASS | PASS | PASS | N/A | PASS | PASS |
| L32-P6 | PASS | PASS | PASS | PASS | PASS | N/A | PASS |
| L32-P7 | PASS | PASS | PASS | PASS | N/A | PASS | PASS |
| L33-P6 | PASS | PASS | PASS | PASS | PASS | N/A | PASS |
| L33-P7 | PASS | PASS | PASS | PASS | N/A | PASS | PASS |
| L34-P6 | PASS | PASS | PASS | PASS | PASS | N/A | PASS |
| L34-P7 | PASS | PASS | PASS | PASS | N/A | PASS | PASS |
| L35-P6 | PASS | PASS | PASS | PASS | PASS | N/A | PASS |
| L35-P7 | PASS | PASS | PASS | PASS | N/A | PASS | PASS |
| L36-P6 | PASS | PASS | PASS | PASS | PASS | N/A | PASS |
| L36-P7 | PASS | PASS | PASS | PASS | N/A | PASS | PASS |

## L32 Gold audit

| Replacement area | Check | Result |
|---|---|---|
| Weather vs climate | 短期天氣、長期氣候統計特徵區分 | PASS |
| Rainfall → runoff | 入滲、坡度、排水、集水區、不透水面共同影響 | PASS |
| Hazard / exposure / vulnerability | 三者定義與風險關係清楚 | PASS |
| Slope hazards | 豪雨不是土石流必然原因，並納入坡度、地質、植被、土地利用 | PASS |

## L36 Gold audit

| Replacement area | Check | Result |
|---|---|---|
| Layer / buffer / overlay / network | 圖層與操作用途正確對應 | PASS |
| Suitability | 多條件篩選與權衡，不是單一最佳條件 | PASS |
| Data quality | 解析度、更新時間、缺漏與尺度限制 | PASS |
| Sustainability | 同時考量環境、社會、經濟、公平與長期影響 | PASS |

## Gate results

- Spatial logic errors: 0
- Map-reading errors: 0
- Unit errors: 0
- Scale errors: 0
- Material-answer conflicts: 0
- Answer-explanation conflicts: 0
- Unsupported spatial inference: 0
- Command-rubric mismatches: 0
- Weak acceptable-answer variants: 0
- Multiple valid answers: 0
- Template risks: 0
- Alignment failures: 0

## Numeric and spatial spot checks

- L31: 同一等高線距離下，甲 60m / 100m、乙 20m / 100m；甲坡度較陡。
- L34: 甲運輸成本 20,000 + 14,000 = 34,000；乙為 12,000 + 14,000 = 26,000。診所服務人口為甲 80,000、乙 35,000，與商閾 60,000 的判斷一致。
- L35: 甲為 40% 能源通過的海峽瓶頸；乙對甲來源依賴 70%，丙對乙成品依賴 60%，替代路線有 20 天與半容量限制。
- L36: 河川／坡度／人口／道路／保育區圖層分工正確；距離條件用 buffer，多條件用 overlay，可達性用 network。

## Frozen regression

- Official: 326 / 326
- Choice: 275 / 275
- Constructed: 51 / 51
- Original practice: 252 / 252
- Existing practices modified: 0
- Lessons modified: 0
- Runtime modified: 0
- Audit scripts modified: 0
- Import executed: NO

## L34-P7 targeted consistency fix

- 移除未由 L34-P7 material 提供的每日 100 噸與每日總成本表述。
- 改以材料可直接重算的每噸成本：甲 340 元／噸、乙 260 元／噸。
- acceptableAnswers 已保留三項核心要求：成本比較、依材料選址、商閾與商品圈的明確區分。
- L34-P7 material-answer consistency: PASS
- Unsupported quantities: 0
- Command-rubric mismatches: 0
- Weak acceptable-answer variants: 0
- Multiple valid answers: 0
- Gold L32 modified: NO
- Gold L36 modified: NO

## DEV self-check

Approved source 結構驗證：12 / 12 practice replacements、8 / 8 Gold teaching replacements。  
本報告是 DEV self-check，不代表 Independent QA 已執行或通過。
