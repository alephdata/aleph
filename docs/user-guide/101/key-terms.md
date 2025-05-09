# Key Terms

OpenAleph uses specific terminology to describe the structure of your data and how you interact with it. Here's a quick overview of the most important terms you'll encounter:

## Dataset

A Dataset contains structured or unstructed data. It is usually controlled by the administrators of an OpenAleph instance, not by the users. While it's not strict requirement, it makes sense to create separate datasets for each data source - that helps keeping search results tidy and provenance of information clear. Learn more about datasets [here](../102/dataset-overview.md)

## Investigation

Unlike a Dataset, an investigation can be changed by the users of OpenAleph. It's your personal work space, you can upload files, map entities and crossreference the list of your favorite crooks here against the rest of the data in OpenAleph. Learn more about investiations [here](../103/investigations.md).

## Entity

Unlike other data search engines, OpenAleph is built around the idea of entities (instead of directories, as tools like Google Drive or Dropbox, for example). An entity is a structured piece of information — like a person, company, or address, but also any document upload to OpenAleph. OpenAleph uses the FollowTheMoney schema to model entities and their relationships, see below.

## FollowTheMoney or FtM

FtM is the data schema that OpenAleph is built upon. It defines what kind of entities OpenAleph knows and what properties and relationships they may have. Any information that you want to store in OpenAleph needs to be converted into the respective FtM entity. Usually, OpenAleph will do that behind the scenes: It will take PDF files, e-mails, word documents or images and create entities from them. Sometimes you might want to do this on your own, you kind find more information about that in the advanced part of the documentation. You can read more about FtM and how it works [here](https://followthemoney.tech)

## Crossreference or xref

Crossreferencing is one of the powerful features of OpenAleph, which relies heavily on the FtM data model. Since every piece of information in OpenAleph is stored in a known schema, the tool can find similar or identical entities across multiple datasets. Or, to describe it in a less technical way: If you have mapped some people that you are currently investigating in OpenAleph, the xref feature will show you all similar entities anywhere in the entire corpus of data you have access to. Find our more about this feature in the [advanced part of the user guide.](../103/cross-reference.md)

## Groups

Access in OpenAleph is managed per dataset and per investigation. Each of them can be shared with individual users or with groups. Once granted permission, members of a group have access to all of the datasets and investigations that have been shared with the group. Groups are created, managed and disabled by OpenAleph administrators.

---

Understanding these terms will make it easier to navigate OpenAleph and get the most out of your data.
