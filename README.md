# 📈 FinStream AI

<div align="center">

![FinStream Banner](https://img.shields.io/badge/FinStream-AI%20Powered%20Portfolio%20Management-00C49F?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBvbHlsaW5lIHBvaW50cz0iMjIgNyAxMy41IDE1LjUgOC41IDEwLjUgMiAxNyI+PC9wb2x5bGluZT48cG9seWxpbmUgcG9pbnRzPSIxNiA3IDIyIDcgMjIgMTMiPjwvcG9seWxpbmU+PC9zdmc+)

**A modern, full-stack financial portfolio management platform with real-time market data, automated data pipelines, and Agentic RAG AI that turns SEC 10-K forms into actionable portfolio insights.**

[🌐 **Live Demo**](https://finstream.mohi-m.com) &nbsp;•&nbsp; [📡 **API Docs**](https://finstream-api.mohi-m.com/swagger-ui.html)

### Tech Stack

**AI / LLM Stack**  
[![LangChain](https://img.shields.io/badge/LangChain-1.1.0-00A67E?logo=langchain&logoColor=white)](https://www.langchain.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-1.8.7-1C3C3C?logo=langchain&logoColor=white)](https://langchain-ai.github.io/langgraph/) [![OpenAI](https://img.shields.io/badge/OpenAI-GPT%205-412991?logo=openai&logoColor=white)](https://platform.openai.com/)

**Backend**  
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot) [![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org/)

**Frontend**  
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**Data & Pipelines**  
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/) [![pgvector](https://img.shields.io/badge/pgvector-RAG-336791?logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector) [![Apache Airflow](https://img.shields.io/badge/Airflow-3.1.5-017CEE?logo=apacheairflow&logoColor=white)](https://airflow.apache.org/)

**Infrastructure**  
[![AWS](https://img.shields.io/badge/AWS-EC2%20%7C%20RDS-FF9900?logo=amazonaws&logoColor=white)](https://aws.amazon.com/)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🤖 **Agentic RAG Portfolio Intelligence**

Generate portfolio and ticker commentary through a multi-step LangGraph workflow that retrieves relevant SEC 10-K chunks before producing grounded AI insights.

### 📚 **SEC Filing Knowledge Base**

Process 10-K filings with Airflow pipelines that download, extract, chunk, embed, and upsert filing sections into pgvector for retrieval-augmented analysis.

</td>
<td width="50%">

### 📊 **Real-Time Market + Financial Data**

Track S&P 500 companies with automated price ingestion, historical charting, and company financials surfaced in a unified research workflow.

### 💼 **Portfolio Management + Secure Access**

Create portfolios, manage holdings, review allocation analytics, and access the platform securely with Firebase-backed Google or GitHub sign-in.

</td>
</tr>
</table>

---

## 🏗️ Architecture

![alt text](Finstream_Architecture.jpg)

---

## 🖼️ Screenshots

<div align="center">
### Landing Page
> Modern, animated landing page with glassmorphism effects

<img src="https://raw.githubusercontent.com/mohi-m/mohi-m.github.io/main/public/images/projects/finstream_landing.png" alt="Landing Page" width="60%"/>

### Stocks Dashboard

> Browse S&P 500 stocks with real-time price cards and watchlist management

<img src="https://raw.githubusercontent.com/mohi-m/mohi-m.github.io/main/public/images/projects/finstream_stocks.png" alt="Stocks Dashboard" width="60%"/>

### Stock Detail View

> Interactive price history charts with financial metrics

<img src="https://raw.githubusercontent.com/mohi-m/mohi-m.github.io/main/public/images/projects/finstream_portfolio.png" alt="Stock Detail" width="60%"/>

### Portfolio Management

> Create portfolios, visualize analytics and view AI insights

<img src="https://raw.githubusercontent.com/mohi-m/mohi-m.github.io/main/public/images/projects/finstream_profile.png" alt="Portfolio Management" width="60%"/>
</div>
---

## 📁 Monorepo Structure

```
FinStream-AI/
├── 🎨 frontend/                  # Typescript + React Webpage
├── ⚙️ backend/                   # Spring Boot API + Agentic RAG AI
├── 🔄 airflow/                   # Data pipelines
└── 📊 data/                      # Seed scripts
```

---

## 🚀 Quick Start (Development)

Each part of the monorepo has its own setup guide:

- [Frontend README](frontend/README.md)
- [Backend README](backend/README.md)
- [Airflow README](airflow/README.md)
- [Seed Scripts README](data/seed/README.md)

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**[⬆ Back to Top](#-finstream-ai)**

</div>
