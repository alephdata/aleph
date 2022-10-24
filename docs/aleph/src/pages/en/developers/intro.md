---
description: >-
  Aleph is a toolkit of powerful components for processing knowledge graphs,
  focussed around the Aleph API server and document processing framework.
---

# Technical introduction

Aleph is an open source toolkit for investigative data analysis. It allows generating, searching and analysing large graphs of heterogeneous data, including public records, structured databases and leaked evidence. The system can integrate data from both unstructured data formats \(like PDF, Email, and other file types\) and structured data such as CSV files, or SQL databases. Data that's been loaded can be securely searched, cross-referenced with other datasets and exported to other systems.

At the core of Aleph's capabilities is [**Follow the Money**](followthemoney/) \(FtM\), a shared data model the encapsulates core concepts such as `People`, `Companies`, `Documents` or `Contracts`. Such data can be generated from tabular inputs, or via the `ingest-file` system that extracts data from dozens of input formats \(including Word, Powerpoint, PDF, Access, E-Mail, ZIP Archives and so on\).

### The basics

{% page-ref page="followthemoney/" %}

{% page-ref page="installation.md" %}

{% page-ref page="technical-faq/" %}

### Getting data in and out

{% page-ref page="mappings.md" %}

{% page-ref page="alephclient.md" %}

The Aleph system also includes [Memorious](memorious.md), a crawler framework that lets you write, manage and control a fleet of scrapers to maintain up-to-date copies of public records from the web.

{% page-ref page="memorious.md" %}

## Architecture overview

![Overview of the architecture used within OCCRP that shows the role of different components, including the memorious crawling toolkit, aleph, and alephclient. Datavault is a simple PostgreSQL staging are used to collect output from scrapers that is eventually projected into Aleph.](https://docs.google.com/drawings/d/e/2PACX-1vRdJA0NtdiQFVsHUvmgR3ypYs2UohoVcgm5MUNm7KpH5yaaH5pdpWAruVEcpUjoZ1GCVshUGrI5SPAG/pub?w=960&amp;h=720)

## Contributing

We're keen to consider pull requests for extensions or bug fixes in all components of the platform. An ideal submission would already follow common coding standards, such as PEP8, and, when significantly changing functionality, include a test case.

Please also consider dropping by in the [Slack instance](http://slack.alephdata.org) before to discuss your idea.





