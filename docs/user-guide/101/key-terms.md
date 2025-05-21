# Key Terms

OpenAleph uses specific terminology to describe the structure of your data and how you interact with it. Here's a quick overview of the most important terms you'll encounter:

## Dataset

A Dataset contains structured or unstructed data. It is usually controlled by the administrators of an OpenAleph instance, not by the users. While it's not a strict requirement, it often makes sense to create separate datasets for each data source. This helps keep search results organized and makes the provenance of information easier to trace. Learn more about datasets [here](../102/dataset-overview.md)

## Investigation

Unlike a Dataset, an investigation can be modified by OpenAleph users. It serves as your personal workspace where you can upload files, map entities, and crossreference your list of favorite crooks against the rest of the data in OpenAleph. Learn more about investiations [here](../103/investigations.md).

## Entity

Unlike other data search engines, OpenAleph is built around the idea of entities, rather than directories like those used in tools like Google Drive or Dropbox. An entity is a structured piece of information, such as a person, company, or address. It can also be any document uploaded to OpenAleph. OpenAleph uses the FollowTheMoney schema to model entities and their relationships (see below).

## FollowTheMoney or FtM

FtM is the data schema that OpenAleph is built upon. It defines the types of entities OpenAleph can recognize, as well as what properties and relationships they may have. Any information you want to store in OpenAleph must be converted into the appropriate FtM entity. Usually, OpenAleph handles this automatically. It can take PDFs, emails, Word documents, or images and generate entities from them behind the scenes. In some cases, you might want to create entities manually. You kind find more information about that in the advanced section of the documentation. Read more about FtM and how it works [here](https://followthemoney.tech)

## Crossreference or xref

Crossreferencing is one of the most powerful features of OpenAleph, and it relies heavily on the FtM data model. Since every piece of information in OpenAleph is stored in a defined schema, the tool can identify similar or identical entities across multiple datasets. To put it more simply: if you'v mapped people you are currently investigating in OpenAleph, the xref feature will show you all similar entities across the entire dataset collection you have access to. Find out more about this feature in the [advanced part of the user guide.](../103/cross-reference.md)

## Groups

Access in OpenAleph is managed at the dataset and investigation level. Each can be shared with individual users or with groups. When a group is granted access, all of its members can view the datasets and investigations shared with that group. Groups are created, managed and disabled by OpenAleph administrators.

---

Understanding these terms will help you navigate OpenAleph more easily and get the most out of your data.
