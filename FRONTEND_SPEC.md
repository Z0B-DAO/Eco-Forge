# EcoForge — Frontend Spec

## Stack

| Outil | Rôle |
|---|---|
| Next.js 14+ (App Router) | Framework React |
| TypeScript | Langage |
| Tailwind CSS | Styling |
| wagmi v2 + viem | Interactions blockchain |
| RainbowKit | Connexion wallet (MetaMask, Core, WalletConnect) |
| Zustand | State management global |
| Recharts | Graphiques (prix, scores, volumes) |
| Lighthouse SDK | Upload IPFS (metadata + images) |
| Anthropic SDK | Appels Claude via Server Actions |

---

## Modèle hybride de crédits carbone

EcoForge accepte deux types de crédits avec un label clair partout dans l'UI :

### Certified (bridgé depuis un registre)

Crédits qui existent déjà sur Verra / Gold Standard. L'issuer retire (annule) le crédit sur le registre officiel, fournit la preuve, et seulement après vérification le token est minté on-chain.

- Label UI : badge vert **"Certified"** + source (ex: "Verra VCS-1234")
- Trust level : haut
- Prix attendu : plus élevé

### Community Verified (natif EcoForge)

Crédits soumis directement par un porteur de projet, sans passer par un registre traditionnel. Validés par l'AI + la communauté DAO.

- Label UI : badge bleu **"Community Verified"**
- Trust level : moyen
- Prix attendu : plus bas

### Impact sur l'UI

- Chaque `CreditCard` et `CreditDetail` affiche le badge d'origine
- Le marketplace permet de filtrer par origine (Certified / Community Verified / All)
- La page `/create` propose deux parcours distincts selon le type
- Le portfolio différencie visuellement les deux types

---

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | Landing | Présentation du projet, stats globales, CTA "Launch App" |
| `/dashboard` | Dashboard | Vue d'ensemble : crédits, governance tokens, progression paliers, activité récente |
| `/marketplace` | Marketplace | Browse tous les crédits, **barre de recherche**, filtres, acheter, signaler |
| `/marketplace/[creditId]` | Détail crédit | Toutes les infos, score AI, historique, buy/sell, **bouton Challenge** |
| `/create` | Créer un crédit | Choix du type (Certified ou Community), puis formulaire adapté |
| ~~`/predictions`~~ | ~~Prediction Market~~ | ~~V2 — NOT IN MVP~~ |
| ~~`/predictions/[predictionId]`~~ | ~~Détail prédiction~~ | ~~V2 — NOT IN MVP~~ |
| `/governance` | Gouvernance | Liste des proposals + disputes actives |
| `/governance/[proposalId]` | Détail proposal | Description, votes pour/contre, voter |
| `/governance/disputes` | Disputes | Crédits contestés, formulaire de challenge |
| `/portfolio` | Portfolio | Tes crédits, crédits retirés (burned), historique de trades, P&L |

---

## Components

### Layout

| Composant | Rôle |
|---|---|
| `Header` | Logo, navigation, `ConnectButton` (RainbowKit), switch réseau |
| `Footer` | Liens, socials |
| `Sidebar` | Navigation secondaire sur les pages internes |

### Web3

| Composant | Rôle |
|---|---|
| `ConnectButton` | RainbowKit, gère MetaMask/Core/WalletConnect |
| `NetworkGuard` | Vérifie que l'user est sur Fuji, sinon prompt switch |
| `TxStatus` | Toast qui montre pending → confirmed → erreur |

### Credits

| Composant | Rôle |
|---|---|
| `CreditCard` | Card dans le marketplace : nom, type, score badge, prix, région, badge d'origine |
| `CreditDetail` | Page complète d'un crédit avec toutes les données + preuve de retirement si Certified |
| `CreditOriginBadge` | Badge **"Certified"** (vert) ou **"Community Verified"** (bleu) affiché partout |
| `ImpactScoreBadge` | Badge visuel coloré 0-100 (rouge → vert) |
| `TradePanel` | Interface buy/sell : quantité, prix total en AVAX, bouton signer |
| `RetireButton` | Burn des crédits (offset carbone permanent) |
| `ChallengeButton` | Bouton "Challenge this credit" visible sur chaque crédit → ouvre DisputeForm |
| `SearchBar` | Recherche par nom de projet, région, type, ID on-chain. Filtrage client-side sur les données déjà chargées |
| `CreditFilters` | Filtres : type de projet, région, range de score, prix, **origine (Certified / Community / All)**, **status (Verified / Pending / Disputed)** |

### AI

| Composant | Rôle |
|---|---|
| `ImpactScorePanel` | Affiche le score + breakdown (additionality, permanence, leakage, verification) + reasoning |
| `AIInsightCard` | Card générique pour afficher un insight AI (réutilisable) |
| `AnalyzeButton` | Bouton qui trigger le Server Action et affiche un loading pendant l'appel Claude (~3-5s) |

### ~~Predictions~~ [V2 — NOT IN MVP]

> Composants PredictionCard, StakePanel, OddsBar, ClaimButton — reportés en V2.

### Governance

| Composant | Rôle |
|---|---|
| `ProposalCard` | Card : titre, type, votes pour/contre, deadline |
| `VotePanel` | Voter FOR/AGAINST, affiche ton voting power |
| `DisputeForm` | Formulaire : raison + **stake de tokens** requis pour soumettre. Affiche le coût en tokens avant confirmation |
| `DisputeCard` | Card d'une dispute active avec status + montant staké par le challenger |

### Rewards & Progression

| Composant | Rôle |
|---|---|
| `MilestoneProgress` | Barre de progression vers le prochain palier (ex: "12/15 actions → Tier 2") |
| `MilestoneList` | Liste de tous les paliers avec status (atteint / en cours / verrouillé) |
| `TokenBalance` | Affiche le nombre de governance tokens + voting power |
| `RewardToast` | Notification quand un nouveau palier est atteint ("Tier 3 reached! +3 tokens") |

### Charts

| Composant | Rôle |
|---|---|
| `PriceChart` | Historique de prix d'un crédit (Recharts line chart) |
| `ScoreHistoryChart` | Evolution du score AI dans le temps |
| `VoteChart` | Barre de progression FOR vs AGAINST sur les proposals |

### Common

| Composant | Rôle |
|---|---|
| `LoadingSpinner` | Spinner global |
| `Modal` | Modal réutilisable |
| `Toast` | Notifications (tx success, erreur, etc.) |
| `EmptyState` | Placeholder quand une liste est vide |

---

## Hooks

| Hook | Rôle |
|---|---|
| `useCredits()` | Lit les credit types depuis le contrat CarbonCredit |
| `useCreditDetail(id)` | Lit un crédit spécifique + son score + metadata IPFS |
| `useSearchCredits(query)` | Filtre les crédits chargés par nom, région, type, ID |
| `useMarketplace()` | Lit les listings actifs depuis le contrat Marketplace |
| `useBuyCredit()` | Prépare + envoie la tx `buyCredits()` |
| `useListCredit()` | Prépare + envoie la tx `listCredits()` |
| `useRetireCredit()` | Prépare + envoie la tx `retireCredits()` |
| `useTradeHistory(address)` | Lit les events Sold/Listed/Cancelled filtrés par adresse (via `getLogs`) |
| `useRetiredCredits(address)` | Lit les events CreditsRetired filtrés par adresse + calcule total CO2 |
| `useLastSoldPrice(creditId)` | Lit `lastSoldPrice` depuis Marketplace (pour valoriser le portfolio) |
| `useProposals()` | Lit les proposals depuis EcoForgeGovernance |
| `useVote()` | Prépare + envoie la tx `vote()` |
| `useDispute()` | Prépare + envoie la tx `disputeCredit()` → auto-crée une proposal |
| `useGovernanceToken()` | Lit le balance de EcoForgeToken de l'user (= voting power) |
| `useMilestoneProgress()` | Lit actions count, palier actuel, progression vers le prochain palier |
| `useUserPortfolio(address)` | Lit les balances ERC-1155 de l'user + crédits retirés + tokens governance |

---

## Server Actions

Les 2 seules fonctions server-side du projet. Elles vivent dans le code Next.js (`"use server"`) et protègent la clé API Anthropic.

| Action | Input | Output | Appel Claude |
|---|---|---|---|
| `generateImpactScore` | projectData + imageBase64? + retirementProof? | `{ score, breakdown, proofConsistency, reasoning, confidence }` | Vision + texte |
| `analyzeDispute` | creditData + disputeReason + imageBase64? | `{ validity, recommendation, reasoning, confidence, redFlags }` | Vision + texte |

---

## Stores (Zustand)

| Store | State |
|---|---|
| `useMarketStore` | Listings chargés, filtres actifs, tri, query de recherche |

Le reste du state vient directement des hooks wagmi (données on-chain) — pas besoin de store supplémentaire.

---

## Données : d'où vient quoi

| Donnée | Source | Comment on la lit |
|---|---|---|
| Liste des crédits | Smart contract CarbonCredit | `useCredits()` → `readContract` |
| Metadata d'un crédit (nom, image, attributs) | IPFS (Lighthouse) | Fetch le `metadataURI` retourné par le contrat |
| Impact score (on-chain) | Smart contract CarbonCredit | `readContract` → `creditTypes[id].impactScore` |
| Impact score (détaillé, breakdown) | Claude API (live) | Server Action `generateImpactScore` |
| Listings marketplace | Smart contract Marketplace | `useMarketplace()` → `readContract` |
| Prix d'un crédit | Smart contract Marketplace (listing.pricePerUnit) | `readContract` |
| Proposals governance | Smart contract EcoForgeGovernance | `useProposals()` → `readContract` |
| Voting power | Smart contract EcoForgeToken (ERC-20) | `useGovernanceToken()` → `balanceOf()` |
| Milestone progression | Smart contract EcoForgeToken | `useMilestoneProgress()` → `getUserProgress()` |
| Balances user (portfolio) | Smart contract CarbonCredit (ERC-1155) | `balanceOfBatch()` |
| Crédits retirés par user | Events `CreditsRetired` (indexed) | `useRetiredCredits()` → `getLogs` filtré par address |
| Total CO2 compensé | `tonnesCO2e` on-chain × quantité retirée | Calculé dans `useRetiredCredits()` |
| Historique trades user | Events `Sold`, `Listed` (indexed) | `useTradeHistory()` → `getLogs` filtré par address |
| Valeur d'un crédit (portfolio) | `lastSoldPrice` dans Marketplace | `useLastSoldPrice()` → `readContract` |
| AVAX/USD prix | Chainlink price feed (on-chain) | `readContract` sur le feed Chainlink |

---

## Flow : page Create (deux parcours)

### Parcours A — Certified Credit

```
1. User choisit "Certified (from registry)"
2. Formulaire :
   - Registre source (Verra / Gold Standard / autre)
   - Numéro de série du retirement
   - Lien vers la preuve de retirement (URL registre)
   - Données projet (nom, type, région, vintage year, tonnes CO2e)
   - Upload image satellite (optionnel mais recommandé)
3. AI VERIFICATION (obligatoire) :
   - Server Action : Claude analyse preuve de retirement + données projet + image
   - Vérifie la cohérence (la preuve correspond-elle au projet ?)
   - Génère un impact score + confidence
   - Affiche le résultat à l'user
4. Anti-double-bridge :
   - Le contrat vérifie on-chain que le hash(registrySource + serialNumber) n'est pas déjà utilisé
   - Si déjà bridgé → tx revert, message d'erreur clair dans l'UI
5. Upload metadata + image + AI score → IPFS (Lighthouse)
6. Tx: CarbonCredit.createCertifiedCredit(params, registrySource, retirementProof)
7. Si AI confidence haute → minté comme Verified → tradeable immédiatement
   Si AI confidence basse → minté comme Pending → review manuelle nécessaire
```

### Parcours B — Community Credit

```
1. User choisit "Community (new project)"
2. Formulaire :
   - Données projet (nom, type, région, vintage year, tonnes CO2e, description détaillée)
   - Upload image satellite (OBLIGATOIRE)
   - Documentation du projet (PDF, liens)
   - Méthodologie utilisée
3. AI VERIFICATION (obligatoire) :
   - Server Action : Claude Vision analyse l'image + données projet + documentation
   - Génère impact score + breakdown + confidence
   - Affiche le résultat preview à l'user
4. User voit le score preview et confirme la soumission
5. Upload metadata + image + AI score → IPFS (Lighthouse)
6. Tx: CarbonCredit.createCommunityCredit(params)
7. Crédit minté avec origin = CommunityVerified, status = Pending
8. Période de challenge DAO (7 jours)
9. Si pas de challenge réussi → status passe à Verified → tradeable
```

### AI vérification dans les DEUX cas

Aucun crédit n'entre dans EcoForge sans passer par Claude. La différence :
- **Certified** : Claude vérifie la cohérence preuve/données, pas la légitimité du projet (déjà certifié par Verra)
- **Community** : Claude évalue la légitimité du projet lui-même (image satellite, additionality, etc.)

---

## Flow utilisateur

```
Landing → Connect Wallet → Dashboard
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         Marketplace     Governance       Create
              │               │               │
              ▼               ▼               ▼
         Search/Buy      Vote/Dispute    Tokenize
         Sell/Challenge   Proposals      New Credit
              │               │               │
              └───────────────┼───────────────┘
                              ▼
                          Portfolio
```

---

## Structure des fichiers frontend

```
src/
├── app/
│   ├── layout.tsx                      # Root layout : providers (wagmi, RainbowKit, Zustand)
│   ├── page.tsx                        # Landing page
│   ├── dashboard/
│   │   └── page.tsx
│   ├── marketplace/
│   │   ├── page.tsx
│   │   └── [creditId]/
│   │       └── page.tsx
│   ├── create/
│   │   └── page.tsx
│   # predictions/ — V2, not in MVP
│   ├── governance/
│   │   ├── page.tsx
│   │   ├── [proposalId]/
│   │   │   └── page.tsx
│   │   └── disputes/
│   │       └── page.tsx
│   └── portfolio/
│       └── page.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Sidebar.tsx
│   ├── web3/
│   │   ├── ConnectButton.tsx
│   │   ├── NetworkGuard.tsx
│   │   └── TxStatus.tsx
│   ├── credits/
│   │   ├── CreditCard.tsx
│   │   ├── CreditDetail.tsx
│   │   ├── CreditOriginBadge.tsx       # Badge "Certified" (vert) ou "Community Verified" (bleu)
│   │   ├── ImpactScoreBadge.tsx
│   │   ├── TradePanel.tsx
│   │   ├── RetireButton.tsx
│   │   ├── ChallengeButton.tsx
│   │   ├── SearchBar.tsx
│   │   └── CreditFilters.tsx
│   ├── ai/
│   │   ├── ImpactScorePanel.tsx
│   │   ├── AIInsightCard.tsx
│   │   └── AnalyzeButton.tsx
│   # predictions/ — V2, not in MVP
│   ├── governance/
│   │   ├── ProposalCard.tsx
│   │   ├── VotePanel.tsx
│   │   ├── DisputeForm.tsx
│   │   └── DisputeCard.tsx
│   ├── rewards/
│   │   ├── MilestoneProgress.tsx
│   │   ├── MilestoneList.tsx
│   │   ├── TokenBalance.tsx
│   │   └── RewardToast.tsx
│   ├── charts/
│   │   ├── PriceChart.tsx
│   │   ├── ScoreHistoryChart.tsx
│   │   └── VoteChart.tsx
│   └── common/
│       ├── LoadingSpinner.tsx
│       ├── Modal.tsx
│       ├── Toast.tsx
│       └── EmptyState.tsx
├── hooks/
│   ├── useCredits.ts
│   ├── useCreditDetail.ts
│   ├── useMarketplace.ts
│   ├── useBuyCredit.ts
│   ├── useListCredit.ts
│   ├── useRetireCredit.ts
│   ├── useTradeHistory.ts
│   ├── useRetiredCredits.ts
│   ├── useLastSoldPrice.ts
│   ├── useSearchCredits.ts
│   ├── useProposals.ts
│   ├── useVote.ts
│   ├── useDispute.ts
│   ├── useGovernanceToken.ts
│   ├── useMilestoneProgress.ts
│   └── useUserPortfolio.ts
├── actions/
│   ├── generateImpactScore.ts          # "use server" — Claude Vision + texte
│   └── analyzeDispute.ts              # "use server" — Claude texte
├── services/
│   ├── web3/
│   │   ├── contracts.ts                # ABIs + adresses des contrats
│   │   └── config.ts                   # Config wagmi (chain Fuji, transports)
│   └── ipfs/
│       └── lighthouse.ts               # Upload/fetch via Lighthouse SDK
├── stores/
│   └── useMarketStore.ts
├── types/
│   ├── contracts.ts                    # Types générés depuis les ABIs Foundry
│   ├── ai.ts                           # Types des réponses Claude
│   └── index.ts
└── lib/
    └── utils.ts                        # Helpers (formatage AVAX, truncate address, etc.)
```
