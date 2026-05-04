# You Know What AI Mean
_A practical guide to AI ethics and responsibility, built from a real-world incident — and from the body of work that came after._

I started this project on 4 October 2023 because I got porn content while using ChatGPT 4 with the TMDB plugin. I reported the issue and started discussing with the chatbot how to really fix such problems.

I ended up evaluating dozens of LLMs, both local and API-powered, for automated ethical assessments — see [ethical-ai](https://github.com/fabriziosalmi/ethical-ai). The same line of thinking eventually produced a portfolio of small tools that enforce, at the level of code, what this document tries to articulate in prose. See *What came next* below.

## Introduction

AI is now embedded in healthcare, education, governance, security, and the everyday tools people use to work and communicate. Understanding the technical layer is no longer enough; the ethical, societal, and legal layers matter just as much. The aim of this guide is narrow: to give practitioners, policymakers, and concerned citizens a shared vocabulary and a working method for thinking about responsible AI.

This is not an academic treatise. It is the deliberate, slightly opinionated output of someone who tripped over an AI failure, asked "how would we even evaluate whether this is OK?", and then spent three years building things that try to answer that question concretely.

### Who this is for

- **AI practitioners** — developers, data scientists, ML engineers — who want a method that maps onto real engineering decisions.
- **Policymakers** drafting regulation and needing a vocabulary that maps onto existing frameworks (OECD, EU AI Act, NIST AI RMF, UNESCO).
- **Researchers and ethicists** comparing approaches across domains.
- **Concerned citizens** who interact with AI systems daily and want a starting point for asking better questions.

## Basic Principles

Ten principles form the backbone of this guide. They are intentionally simple. The hard work is not in stating them but in applying them under conflict (see *Trade-offs between principles*) and in mapping them to enforceable practice (see *Mapping to existing frameworks*).

1. **Respect** — AI must respect the user's privacy and data. *Key tension: useful personalization vs. minimum data collection.*
2. **Transparency** — AI must be transparent in its decisions and actions. *Key tension: explainability often costs accuracy or leaks proprietary detail.*
3. **Fairness** — AI must treat users fairly and minimize bias. *Key tension: different definitions of fairness are mutually incompatible (Kleinberg–Chouldechova).*
4. **Safety** — AI must protect users and their data from harm. *Key tension: every safety filter has a latency, accuracy, and false-positive cost.*
5. **Control** — Users must retain meaningful control over AI affecting them. *Key tension: user override vs. system-enforced limits.*
6. **Accountability** — AI systems and operators must be accountable for outcomes. *Key tension: composite systems have no single owner of the seam.*
7. **Reliability** — AI must perform consistently and predictably. *Key tension: a system that adapts is a moving audit target; a frozen one ages into bias.*
8. **Human Dignity** — AI must not instrumentalize, degrade, or violate the inherent worth of the people it interacts with — even when actions are technically permitted by other principles. *Key tension: dignity is contextual; default-safe behavior in one setting becomes paternalism in another.*
9. **Legal** — AI must comply with applicable laws. *Key tension: laws differ across jurisdictions and lag the technology.*
10. **Social** — AI must consider its broader societal impact, including environmental and labor effects. *Key tension: societal impact is plural and slow to measure.*

A note on principle 8. The original draft of this guide listed "Ethical" as the eighth principle, which was incoherent — the entire framework is ethical. *Human Dignity* is what that slot was reaching for: the principle that catches failures the others miss. The TMDB incident violated dignity before it violated anything else.

## Case study: the TMDB incident

The genesis of this guide was a specific failure: a ChatGPT 4 plugin connected to The Movie Database (TMDB) returned explicit adult content during a casual movie-discovery conversation. Useful as a worked example.

### What went wrong

The model itself behaved correctly. The plugin was technically functional. The TMDB API returned data it was authorized to return. The harm came from the **composition**: nobody had defined whose job it was to filter content at the seam between three systems.

### Which principles were violated

- **Human Dignity** — explicit content injected into a non-explicit context, without consent. The user did not opt in to adult-themed interaction.
- **Control** — no plugin-level toggle for content sensitivity; user preferences were not propagated to the plugin layer.
- **Safety** — no content filter at the plugin boundary. The LLM's safety filtering applied to its own outputs, not to plugin-returned data.
- **Transparency** — the plugin's data scope and possible outputs were not disclosed at the start of the interaction.
- **Accountability** — ambiguous responsibility chain: model provider, data source, or plugin author?

Notably *not* violated: Legal (the data was lawfully published metadata), Fairness (no group was disproportionately affected), Reliability (each component did what its scope allowed it to do).

### What a checklist would catch — and what it wouldn't

A pre-deployment review with this guide's principles would likely have surfaced:

- Missing content filter at integration boundary
- Missing user-level consent/opt-out
- Unclear responsibility chain

What it would *not* have surfaced is the deeper structural lesson: **most AI failures happen at composition boundaries, not inside well-audited components**. Standard ethics review tools audit components in isolation; they rarely audit the seams. This is the bias the framework should explicitly counteract — and the workflow below (*Integration review*) is built around it.

## What came next: artifacts, not arguments

The point of starting from a real incident is to commit to building something in response, not just to argue. This section is the public ledger of what came after the TMDB incident — actual repositories that operationalize specific principles from this guide. They are not the only useful artifacts in the field, only my own attempts. They are listed by which principle each primarily serves.

### Ethical assessment of LLMs themselves

- **[ethical-ai](https://github.com/fabriziosalmi/ethical-ai)** — Python tool that automates ethical alignment and trustworthiness assessments for LLMs across providers (LM Studio, OpenAI, Gemini, Anthropic, OpenAI-compatible endpoints). Multi-sampling with random temperatures, median aggregation across samples, edge-case retries on extreme scores, comparative reports in Markdown / HTML / PDF. The literal closure of the loop opened by the TMDB incident.

### Filtering and policy at integration boundaries (Safety, Human Dignity, Control)

The TMDB failure was at the integration boundary between an LLM and an external data source. Most of the work since has been at boundaries:

- **[aidlp](https://github.com/fabriziosalmi/aidlp)** — DLP proxy that intercepts traffic to LLM providers and redacts sensitive data before it leaves the user's network. Combines deterministic patterns (FlashText) with NLP entity recognition (Presidio/spaCy), parallelized to preserve context windows. Fail-closed by default.
- **[llmproxy](https://github.com/fabriziosalmi/llmproxy)** — security-first gateway for LLMs across 15 providers. Six-layer defense pipeline: byte-level ASGI firewall, injection scoring, PII masking, immutable audit ledger, HMAC response signing, fail-closed auth middleware. Drop-in OpenAI replacement.
- **[caddy-waf](https://github.com/fabriziosalmi/caddy-waf)** — WAF middleware for Caddy. Linear-time regex (RE2), anomaly scoring, four-phase inspection, GeoIP, ASN/Tor blocklists, hot reload. AGPL-3.0.
- **[caddy-adf](https://github.com/fabriziosalmi/caddy-adf)** — Caddy anomaly-detection middleware that scores each request and flags or blocks above a configurable threshold.
- **[patterns](https://github.com/fabriziosalmi/patterns)** — daily-refreshed OWASP Core Rule Set in native Nginx, Apache, Traefik, and HAProxy syntax. The boring part of edge security, automated.
- **[proxymate](https://github.com/fabriziosalmi/proxymate)** — privacy-first menu-bar HTTP/HTTPS/SOCKS proxy for macOS, with built-in WAF, transparent TLS interception, AI-agent controls, and a credential-exfiltration scanner. Notarized, zero telemetry.
- **[fqdn-model](https://github.com/fabriziosalmi/fqdn-model)** — ML classifier predicting whether a fully qualified domain name is benign or malicious. Lexical features, no traffic required.
- **[asn-api](https://github.com/fabriziosalmi/asn-api)** — real-time trust scoring for Internet Autonomous Systems using BGP telemetry, threat intelligence, and network topology analysis. Trust expressed at the protocol layer.
- **[domainmate](https://github.com/fabriziosalmi/domainmate)** — domain and security monitoring (WHOIS expiration, SSL validity, SPF/DMARC, security headers, IP reputation).
- **[blacklists](https://github.com/fabriziosalmi/blacklists)** — daily-refreshed domain blacklists.

### Quality and accountability for AI-generated output (Reliability, Accountability)

The other side of the integration boundary is what AI ships *out*. "Slop" — plausible-looking, low-substance LLM output — is the contemporary equivalent of the TMDB failure: a system technically working, producing things nobody asked for, with no human pre-flight check.

- **[vibe-check](https://github.com/fabriziosalmi/vibe-check)** — anti-slop CI/CD gatekeeper. 300+ rules across security, stability, maintainability, performance, code hygiene, AI-slop detection, and git anti-patterns. AST-based for Python. Native GitHub Action.
- **[gitoma](https://github.com/fabriziosalmi/gitoma)** — autonomous repo-improvement agent with a 22-guard self-correcting critic stack that catches broken syntax, dropped functions, hallucinated frameworks, README destruction, and dead code before they ship. Local-first: code, diffs, and secrets never leave the laptop.
- **[brutal-coding-tool](https://github.com/fabriziosalmi/brutal-coding-tool)** — repository due-diligence tool with an explicit "Engineering Substance vs. AI Slop" axis.
- **[repolizer](https://github.com/fabriziosalmi/repolizer)** — repository health analysis across 10+ dimensions: security, documentation, code quality, performance, testing, accessibility, CI/CD, maintainability, licensing, community.

### Decentralization as architecture, not rhetoric (Equal Decentralization)

The decentralization section of this guide aged best of the original 2023 draft, partly because in the years since I tried to actually build the thing:

- **[shortlist](https://github.com/fabriziosalmi/shortlist)** — decentralized broadcasting swarm using Git itself as the coordination backend. Atomic commits replace Zookeeper; every node holds the full coordination state.
- **[synapse-ng](https://github.com/fabriziosalmi/synapse-ng)** — self-governing, self-funding, self-evolving decentralized network. Each node is an autonomous agent.
- **[tad](https://github.com/fabriziosalmi/tad)** — peer-to-peer chat for offline-first communities.
- **[aimp](https://github.com/fabriziosalmi/aimp)** — experimental serverless networking protocol for resilient state synchronization between autonomous agents in fragmented, low-bandwidth networks. Built on Merkle-CRDTs.

### Compliance (Legal)

- **[nis2-public](https://github.com/fabriziosalmi/nis2-public)** — NIS2 Directive (EU 2022/2555) continuous posture management. GRC checklist mapped to Art. 21 sub-paragraphs, technical validation engine, incident workflow. Honest about what stays manual.
- **[nis2-model](https://github.com/fabriziosalmi/nis2-model)** — deterministic compliance engine for NIS2 and DORA.

### Local-first AI (Privacy, Decentralization)

- **[silicondev](https://github.com/fabriziosalmi/silicondev)** — local LLM fine-tuning and chat for Apple Silicon.

### A note on the list

This is not a portfolio in the marketing sense. Several entries are deliberately small and opinionated; some are written in a register some readers will find abrasive (the "brutal" prefix on the auditing tools is intentional — it signals that those tools refuse to soften their findings). The aggregate point is: **the principles in this guide were not derived from theory and then applied to practice. They were extracted from practice and then arranged into theory.**

I do not claim the listed artifacts solve the problems they address. They reduce categories of failure mode by a measurable amount in real traffic. That is what an "ethical AI" tool actually looks like at the level of code.

## Trade-offs between principles

Listing ten principles is the easy part. The actual work is in cases where they pull against each other, and where every choice has costs.

- **Privacy vs. Transparency.** "Show your work" can leak training data, user history, or proprietary methods. Differential privacy, model cards, and access-controlled audits are partial answers — none free. (See `aidlp` for one operationalization: redact at the proxy, log to an immutable ledger you control.)
- **Autonomy vs. Safety.** Honoring user agency means letting users override; safety means having limits the user cannot override. Where you draw the line is a *choice*, not a calculation. Medical and automotive systems have spent decades learning this.
- **Fairness as parity of outcome vs. parity of treatment.** Equal accuracy, equal false-positive rates, and equal calibration are different definitions of "fair", and they are typically mutually incompatible when base rates differ across groups (Kleinberg–Chouldechova). Pick one, justify it, document it.
- **Explainability vs. Performance.** Post-hoc explanation methods (LIME, SHAP) often don't reflect what the model actually does. Inherently interpretable models usually underperform on hard tasks. There is no free lunch — only trade-off-aware choices.
- **Latency vs. Safety filters.** Every safety check at inference (input scanning, output redaction, policy enforcement) costs milliseconds. At scale this is real money and real user experience. `aidlp` addresses this with parallel async workers; even then, the trade-off doesn't go to zero.
- **Memorization vs. Generalization.** Models that memorize their training set perform worst at generalization and risk regurgitating private data. The fix (regularization, deduplication, training-set audits) costs accuracy.
- **Reliability vs. Adaptability.** A system that updates frequently is by definition a moving audit target. A frozen model ages into bias and irrelevance.
- **Bias mitigation vs. Majority-class accuracy.** Re-balancing for fairness on minority groups can reduce accuracy on the majority class. The trade-off must be made deliberately, by humans, and recorded.
- **Accountability vs. Decentralization.** When an LLM provider serves a SaaS integrator who serves an end customer, who is liable for harm at the seam? This is the open problem of foundation-model deployment, and the operational gap that DLP and proxy layers (e.g. `aidlp`, `llmproxy`) try to fill structurally — by making the customer-side organization the policy enforcer at its own boundary.

A useful framework names which trade-off is at stake in a given decision and forces the team to record the choice — not pretend it doesn't exist.

## Mapping to existing frameworks

This guide does not invent ethics from scratch. Its ten principles overlap substantially with prior work and existing instruments. Anyone using it should also be aware of the following.

| Principle here | OECD (2019) | EU AI Act (Reg. 2024/1689) | NIST AI RMF (2023) | UNESCO (2021) |
|---|---|---|---|---|
| Respect | Human-centred values (privacy) | Art. 10 (data governance) | Govern, Map | Right to privacy |
| Transparency | Transparency and explainability | Art. 13 (transparency obligations) | Map, Measure | Transparency and explainability |
| Fairness | Human-centred values and fairness | Art. 10 (bias mitigation) | Govern (fairness), Manage | Fairness and non-discrimination |
| Safety | Robustness, security, safety | Art. 9 (risk mgmt), Art. 15 (accuracy/robustness) | Manage | Safety and security |
| Control | Human-centred values (autonomy) | Art. 14 (human oversight) | Govern | Human oversight and determination |
| Accountability | Accountability | Art. 73 (incident reporting) | Govern | Responsibility and accountability |
| Reliability | Robustness, security, safety | Art. 15 | Manage | (within Safety) |
| Human Dignity | Human-centred values (dignity) | Art. 5 (prohibited practices); Recital 27 | Govern | Human dignity (foundational value) |
| Legal | Rule of law (within Human-centred values) | (entire instrument) | Govern | Rule of law |
| Social | Inclusive growth, sustainable development | Recitals on societal impact | Govern, Map | Multiple |

The point of this table is not to claim equivalence, but to direct readers to instruments that have legal force, regulatory backing, or wider expert consensus than this document. Where this guide can add value is at the level of practice — checklists, workflows, multi-stakeholder framing, and the artifacts in *What came next* — not at the level of normative authority.

## Equal Decentralization

AI's development, control, and benefits should not concentrate in any single region or entity. This is partly a moral position and partly a practical observation: monopoly capture leads to brittle systems and narrow value alignment.

Concretely, decentralization across four axes:

- **Development and innovation** — research, talent, and tooling distributed across geographies, cultures, and economic backgrounds. The 2026 reality (compute concentration, weight-access asymmetry, regulatory arbitrage) makes this harder, not easier.
- **Control and oversight** — no single entity, organization, or government with unilateral authority over AI systems and their applications.
- **Benefits and economic gains** — value distributed across sectors and demographics, not captured by a small number of firms with model-access privileges.
- **Governance** — decisions made through bodies that include technologists, policymakers, civil society, and affected end users — not just incumbent vendors.

The principle is not just rhetorical. The same arc that produced this guide also produced experiments in actually decentralizing the substrate: [shortlist](https://github.com/fabriziosalmi/shortlist) (Git as a coordination backend, no central server), [synapse-ng](https://github.com/fabriziosalmi/synapse-ng) (self-governing peer network), [tad](https://github.com/fabriziosalmi/tad) (P2P chat for offline-first communities), [aimp](https://github.com/fabriziosalmi/aimp) (Merkle-CRDT autonomous-agent protocol). They are partial answers, but they are answers in code.

## Roles

In AI development and deployment, each stakeholder plays a distinct role. Collaboration across them is what makes the framework operative rather than aspirational.

- **Government** — craft policy, establish legal frameworks, and provide oversight to ensure the development and deployment of AI adhere to ethical, legal, and societal norms. Encourage innovation while safeguarding citizens' interests and ensuring equitable distribution of benefits.
- **Tech Companies** — engage in ethical development, compliance, and collaboration with stakeholders. Prioritize transparency, accountability, and inclusivity in AI initiatives.
- **AI Developers** — adhere to established guidelines, advocate for ethical AI, and stay current on the ethical implications of emerging AI technologies.
- **General Public** — participate, advocate, and provide feedback so AI developments align with societal values.
- **Academia** — conduct research, develop ethical frameworks, and educate the next generation of AI developers — equipping them with technical knowledge and an understanding of the ethical, societal, and legal implications.
- **NGOs** — advocate for ethical AI, monitor deployments, and serve as watchdogs. Run awareness campaigns to inform the public and other stakeholders.

### The general public's role

The general public is not a passive audience for AI but an active stakeholder. The role spans:

- **Advocacy and awareness** — staying informed about AI technologies and supporting organizations that champion ethical AI.
- **Demanding transparency** — insisting on clear explanations of how AI systems make decisions in healthcare, finance, governance, and other domains.
- **Reporting and participation** — flagging unethical or harmful uses, engaging in public consultations, and joining decision-making processes related to AI.
- **Supporting accountability and fairness** — backing policies that hold AI systems and developers accountable, and initiatives that mitigate bias.
- **Sustainability and privacy** — favoring AI technologies that prioritize environmental sustainability and personal data protection.

A well-informed public is the most robust pillar supporting ethical AI development and application.

## Reporting AI failures: what exists, and how to use it

The original draft of this section proposed a globally accessible AI reporting system from scratch. Several useful systems already exist; this section directs readers to them and notes the gaps that remain.

### What exists

- **AI Incident Database** (Partnership on AI / Responsible AI Collaborative) at [incidentdatabase.ai](https://incidentdatabase.ai) — public, searchable database of AI failures with a structured taxonomy. Anyone can submit; submissions are editor-reviewed.
- **OECD AI Incidents Monitor** at [oecd.ai](https://oecd.ai) — real-time tracking of AI incidents drawn from global news sources.
- **MITRE ATLAS** at [atlas.mitre.org](https://atlas.mitre.org) — taxonomy of adversarial techniques against AI systems, parallel to MITRE ATT&CK. Used for threat modeling and red-teaming.
- **EU AI Act Article 73** — mandatory incident reporting for providers of high-risk AI systems within the EU. Not voluntary; staged effective dates between 2025 and 2027.

### What's still missing

- **No mandatory global reporting.** Only the EU has begun to legislate; US, UK, and Asian jurisdictions vary widely.
- **Coverage bias.** Public databases over-represent English-language incidents in US/EU. Failures in non-Western contexts are systematically under-counted.
- **No common taxonomy.** AIID, OECD AIM, ATLAS, and EU reporting use different schemas. Cross-database analysis is hard.
- **No end-user channel.** Existing systems are designed for researchers, journalists, and companies. There is no equivalent of a 911 line for "I just had a bad AI interaction".
- **Severity classification is informal.** There is no agreed scale for "minor harm" vs. "serious harm" vs. "systemic risk".

### What practitioners should do today

1. **Instrument and log every AI integration boundary.** TMDB-style failures are invisible without logs at the seam. (See [aidlp](https://github.com/fabriziosalmi/aidlp) and [llmproxy](https://github.com/fabriziosalmi/llmproxy) for two reference implementations of boundary instrumentation, including immutable audit ledgers.)
2. **Submit to AIID** when an incident affects users. Submissions are how the public dataset improves.
3. **Use ATLAS for threat modeling** before deployment, not after.
4. **Follow Article 73 obligations** if you are a high-risk AI provider in the EU.
5. **Don't reinvent the system.** Improving coverage in existing databases is more useful than launching a parallel one.

### What end users should do

1. **Report to the operator first** — the company providing the AI service.
2. **Submit to AIID** if the operator does not respond, or if the incident is significant.
3. **Document with screenshots** before reporting. UI evidence is much stronger than recollections.

## A self-assessment review

The original draft framed this as a "Universal Adaptive Ethical AI Index" with a numeric formula. A subsequent revision degraded that to a 100-prompt 0–10 scoring checklist. Both have the same problem: a number that looks like measurement and is not.

This version drops the score entirely. What remains is a structured **review** — for each of the ten principles, the team writes a short record of decisions made.

### Per-principle review record

For each principle, produce a short written entry covering:

1. **What's at stake here** — restate the principle in terms of *this specific* system. Generic boilerplate doesn't count.
2. **What we've done** — concrete, citable decisions: filters, controls, audits, defaults, opt-outs. Reference the artifact (model card section, code path, policy doc, architecture decision record).
3. **What we explicitly chose not to do, and why** — trade-offs accepted (cf. *Trade-offs*). Naming what you didn't do is what distinguishes a deliberate choice from an oversight.
4. **What we don't yet know** — open questions for the next iteration.
5. **Who reviewed this** — name and role; for high-stakes systems, third-party review.

The output is not a percentage. It is a document, and the fact that you wrote it is more important than what number it would have produced. For a worked example, see how [ethical-ai](https://github.com/fabriziosalmi/ethical-ai) operationalizes per-question median scoring across multiple samples and providers — it produces a profile, not a single grade.

### Integration review

Component-level review is necessary but not sufficient. Most public AI failures (the TMDB incident among them) happen at integration boundaries: plugin-to-model, model-to-downstream-service, agent-to-external-API.

For each integration boundary in the system, ask:

- What can the upstream component send that the downstream isn't prepared to handle?
- What can the downstream component return that propagates back into a context where it becomes harmful?
- Whose policy applies at the boundary — and is it actually enforced *there*, or assumed to be enforced somewhere else?
- If something goes wrong at the boundary, who is liable, and is that documented in writing?
- Is the boundary instrumented? Are inputs, outputs, and policy decisions logged in a way that supports post-hoc incident review?

The TMDB case is the canonical illustration: each component (LLM, plugin, TMDB API) was individually fine. The composition was where the failure lived, and there was no policy owner at the seam.

### Pilot, feedback, and revision

The framework is not a one-shot artifact. Useful refinement requires:

- **Pilot deployments** across a diverse set of systems (industries, scales, modalities) so vague prompts get sharpened.
- **Stakeholder feedback** from users, developers, ethicists, and policymakers — captured through structured interviews, not satisfaction surveys.
- **An iterative loop** triggered by external events: new legislation, real incidents, model capability changes.
- **Public documentation** of methodology, findings, and revisions.

This is ordinary lifecycle work. There is no need to dress it up as a novel methodology.

## Human–AI Collaboration

Human–AI collaboration is not just humans using AI as a tool; it is a relationship where both contribute to outcomes. Designing it well requires:

- **Mutual understanding** — the system should be designed to handle human values and limitations; humans should be educated about the system's capabilities and constraints.
- **Final authority on hard decisions** — in complex or ambiguous situations, humans should have the final say. The system should be transparent about how it reached a recommendation.
- **Trust earned over time** — trust is built by consistent behavior, not assumed by default. Track record matters more than promises.
- **Adaptation in both directions** — the system adapts to user values and feedback; users adjust their workflows as they learn the system's strengths and weaknesses.
- **Conflict-resolution mechanisms** — when the system's recommendation conflicts with the user's judgment, there must be a defined path to decide and to record the choice.
- **Informed consent** — users entering a collaborative relationship with an AI system should understand what the system will and will not do, and what data it uses.
- **Accountability and governance** — collaboration does not dilute responsibility. A governance structure must oversee the relationship, including third-party review where stakes are high.

## Closing

The genesis of this guide was an unwanted output from a chatbot plugin in October 2023. That is a small failure compared to what AI systems can and will do at larger scales — but it is the right scale to start from, because most AI ethics is about boring, daily systems behaving badly in ways that are individually small and collectively significant.

The honest test of any framework is what it produces. The repos in *What came next* are the deliverable form of this one: instrumentation, filters, gates, and audit layers built precisely at the boundaries where the original failure happened, plus an evaluation tool ([ethical-ai](https://github.com/fabriziosalmi/ethical-ai)) that closes the loop on the question "is this AI behaving ethically?" by asking it directly, many times, with controlled variance.

I do not claim the ten principles are exhaustive, the trade-offs are complete, or the review template is sufficient. I claim that explicit beats implicit, multi-stakeholder beats unilateral, instrumented seams beat hopeful integrations, and that documenting your choices — including the ones you got wrong — is more useful than perfecting an unenforceable framework on paper.

## References

### Frameworks and guidelines
- OECD AI Principles (2019, updated 2024) — [oecd.ai/en/ai-principles](https://oecd.ai/en/ai-principles)
- EU AI Act, Regulation (EU) 2024/1689 — Official Journal of the EU, 12 July 2024 — [eur-lex.europa.eu](https://eur-lex.europa.eu/eli/reg/2024/1689/oj)
- NIST AI Risk Management Framework 1.0 (2023) — [nist.gov/itl/ai-risk-management-framework](https://www.nist.gov/itl/ai-risk-management-framework)
- UNESCO Recommendation on the Ethics of Artificial Intelligence (2021) — [unesco.org/en/artificial-intelligence/recommendation-ethics](https://www.unesco.org/en/artificial-intelligence/recommendation-ethics)
- Asilomar AI Principles (2017) — [futureoflife.org/open-letter/ai-principles](https://futureoflife.org/open-letter/ai-principles/)

### Reporting and threat-modeling systems
- AI Incident Database — [incidentdatabase.ai](https://incidentdatabase.ai)
- OECD AI Incidents Monitor — [oecd.ai](https://oecd.ai)
- MITRE ATLAS — [atlas.mitre.org](https://atlas.mitre.org)

### Trade-offs literature
- Kleinberg, Mullainathan, Raghavan, *Inherent Trade-Offs in the Fair Determination of Risk Scores* (2016) — [arxiv.org/abs/1609.05807](https://arxiv.org/abs/1609.05807)
- Chouldechova, *Fair prediction with disparate impact: A study of bias in recidivism prediction instruments* (2017) — [arxiv.org/abs/1610.07524](https://arxiv.org/abs/1610.07524)

---

_Originally drafted October 2023 in dialogue with ChatGPT-4. Pruned, restructured, and grounded in subsequent work in 2026._
