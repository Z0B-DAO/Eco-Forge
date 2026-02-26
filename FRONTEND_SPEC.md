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
| `/dashboard` | Dashboard | Vue d'ensemble : tes crédits, tes stakes, activité récente |
| `/marketplace` | Marketplace | Browse tous les crédits listés, filtres (type, région, score), acheter |
| `/marketplace/[creditId]` | Détail crédit | Toutes les infos d'un crédit : metadata, score AI, historique, bouton buy/sell |
| `/create` | Créer un crédit | Choix du type (Certified ou Community), puis formulaire adapté |
| `/predictions` | Prediction Market | Liste des prédictions actives, odds en temps réel |
| `/predictions/[predictionId]` | Détail prédiction | Question, odds, graphe YES/NO, staker AVAX, insight AI |
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
| `CreditFilters` | Filtres : type de projet, région, range de score, prix, **origine (Certified / Community / All)** |

### AI

| Composant | Rôle |
|---|---|
| `ImpactScorePanel` | Affiche le score + breakdown (additionality, permanence, leakage, verification) + reasoning |
| `TrendForecastPanel` | Affiche prédiction bullish/bearish, price targets, confidence, key drivers |
| `AIInsightCard` | Card générique pour afficher un insight AI (réutilisable) |
| `AnalyzeButton` | Bouton qui trigger le Server Action et affiche un loading pendant l'appel Claude (~3-5s) |

### Predictions

| Composant | Rôle |
|---|---|
| `PredictionCard` | Card : question, odds YES/NO, temps restant, total staké |
| `StakePanel` | Choisir YES/NO, montant AVAX, signer tx |
| `OddsBar` | Barre visuelle YES vs NO en pourcentage |
| `ClaimButton` | Récupérer gains après résolution |

### Governance

| Composant | Rôle |
|---|---|
| `ProposalCard` | Card : titre, type, votes pour/contre, deadline |
| `VotePanel` | Voter FOR/AGAINST, affiche ton voting power |
| `DisputeForm` | Formulaire : sélectionner un crédit, écrire la raison, soumettre dispute |
| `DisputeCard` | Card d'une dispute active avec status |

### Charts

| Composant | Rôle |
|---|---|
| `PriceChart` | Historique de prix d'un crédit (Recharts line chart) |
| `ScoreHistoryChart` | Evolution du score AI dans le temps |
| `PoolChart` | Répartition YES/NO dans une prediction pool (pie/bar) |

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
| `useMarketplace()` | Lit les listings actifs depuis le contrat Marketplace |
| `useBuyCredit()` | Prépare + envoie la tx `buyCredits()` |
| `useListCredit()` | Prépare + envoie la tx `listCredits()` |
| `useRetireCredit()` | Prépare + envoie la tx `retireCredits()` |
| `usePredictions()` | Lit les prédictions actives depuis PredictionPool |
| `useStake()` | Prépare + envoie la tx `stake()` |
| `useClaim()` | Prépare + envoie la tx `claim()` |
| `useProposals()` | Lit les proposals depuis EcoForgeGovernance |
| `useVote()` | Prépare + envoie la tx `vote()` |
| `useDispute()` | Prépare + envoie la tx `disputeCredit()` |
| `useUserPortfolio(address)` | Lit les balances ERC-1155 de l'user + crédits retirés |

---

## Server Actions

Les 3 seules fonctions server-side du projet. Elles vivent dans le code Next.js (`"use server"`) et protègent la clé API Anthropic.

| Action | Input | Output | Appel Claude |
|---|---|---|---|
| `generateImpactScore` | projectData + imageBase64 | `{ score, breakdown, reasoning, confidence }` | Vision + texte |
| `generateTrendForecast` | marketData (prix, news) | `{ prediction, targets, confidence, drivers }` | Texte seul |
| `analyzeDispute` | disputeData (crédit + raison) | `{ validity, recommendation, reasoning }` | Texte seul |

---

## Stores (Zustand)

| Store | State |
|---|---|
| `useMarketStore` | Listings chargés, filtres actifs, tri |
| `usePredictionStore` | Prédictions chargées, filtre (actif/résolu) |

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
| Prédictions | Smart contract PredictionPool | `usePredictions()` → `readContract` |
| Odds YES/NO | Smart contract PredictionPool | `readContract` → `getOdds()` |
| Proposals governance | Smart contract EcoForgeGovernance | `useProposals()` → `readContract` |
| Balances user (portfolio) | Smart contract CarbonCredit (ERC-1155) | `balanceOfBatch()` |
| Trend forecast | Claude API (live) | Server Action `generateTrendForecast` |
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
   - Données projet (nom, type, région, vintage year)
   - Upload image satellite (optionnel)
3. Upload metadata + image → IPFS (Lighthouse)
4. Tx: CarbonCredit.createCertifiedCredit(params, registrySource, retirementProof)
5. Crédit minté avec origin = Certified, status = Verified
6. Tradeable immédiatement sur le marketplace
```

### Parcours B — Community Credit

```
1. User choisit "Community (new project)"
2. Formulaire :
   - Données projet (nom, type, région, vintage year, description détaillée)
   - Upload image satellite (obligatoire)
   - Documentation du projet (PDF, liens)
   - Méthodologie utilisée
3. Server Action : Claude Vision analyse l'image + données → génère impact score preview
4. User voit le score preview et confirme la soumission
5. Upload metadata + image + score → IPFS (Lighthouse)
6. Tx: CarbonCredit.createCommunityCredit(params)
7. Crédit minté avec origin = CommunityVerified, status = Pending
8. Période de challenge DAO (7 jours)
9. Si pas de challenge réussi → status passe à Verified → tradeable
```

---

## Flow utilisateur

```
Landing → Connect Wallet → Dashboard
                              │
              ┌───────────────┼───────────────┐──────────────┐
              ▼               ▼               ▼              ▼
         Marketplace     Predictions     Governance      Create
              │               │               │              │
              ▼               ▼               ▼              ▼
         Buy/Sell        Stake AVAX       Vote/Dispute   Tokenize
         Credits         YES/NO           Proposals      New Credit
              │               │               │              │
              └───────────────┼───────────────┘              │
                              ▼                              │
                          Portfolio ◄─────────────────────────┘
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
│   ├── predictions/
│   │   ├── page.tsx
│   │   └── [predictionId]/
│   │       └── page.tsx
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
│   │   └── CreditFilters.tsx
│   ├── ai/
│   │   ├── ImpactScorePanel.tsx
│   │   ├── TrendForecastPanel.tsx
│   │   ├── AIInsightCard.tsx
│   │   └── AnalyzeButton.tsx
│   ├── predictions/
│   │   ├── PredictionCard.tsx
│   │   ├── StakePanel.tsx
│   │   ├── OddsBar.tsx
│   │   └── ClaimButton.tsx
│   ├── governance/
│   │   ├── ProposalCard.tsx
│   │   ├── VotePanel.tsx
│   │   ├── DisputeForm.tsx
│   │   └── DisputeCard.tsx
│   ├── charts/
│   │   ├── PriceChart.tsx
│   │   ├── ScoreHistoryChart.tsx
│   │   └── PoolChart.tsx
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
│   ├── usePredictions.ts
│   ├── useStake.ts
│   ├── useClaim.ts
│   ├── useProposals.ts
│   ├── useVote.ts
│   ├── useDispute.ts
│   └── useUserPortfolio.ts
├── actions/
│   ├── generateImpactScore.ts          # "use server" — Claude Vision + texte
│   ├── generateTrendForecast.ts        # "use server" — Claude texte
│   └── analyzeDispute.ts              # "use server" — Claude texte
├── services/
│   ├── web3/
│   │   ├── contracts.ts                # ABIs + adresses des contrats
│   │   └── config.ts                   # Config wagmi (chain Fuji, transports)
│   └── ipfs/
│       └── lighthouse.ts               # Upload/fetch via Lighthouse SDK
├── stores/
│   ├── useMarketStore.ts
│   └── usePredictionStore.ts
├── types/
│   ├── contracts.ts                    # Types générés depuis les ABIs Foundry
│   ├── ai.ts                           # Types des réponses Claude
│   └── index.ts
└── lib/
    └── utils.ts                        # Helpers (formatage AVAX, truncate address, etc.)
```
