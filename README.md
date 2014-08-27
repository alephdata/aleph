document-driven investigative tools
===================================

This is a collection of tools for ingesting, normalizing, indexing and
tagging documents in the context of a journalistic investigation. 

These tools are intended to be complementary to existing platforms such
as [DocumentCloud](http://documentcloud.org) and
[analice.me](http://analice.me).


Basic ideas
-----------

* An entity (such as a person, organisation, or topic) is always a search 
  query; each entity can have multiple actual queries associated with it
  by means of aliases (tags?).
* Documents can be anything, and there is no guarantee that ``dit`` will be  
  able to display it - just index it. Document display is handled by
  DocumentCloud etc.
* Documents matching an entity after that entity has been created yield  
  notifications if a user is subscribed.


Existing tools
--------------

* DocumentCloud, analice.me, resourcecontracts.org
* nltk, patterns
* OpenCalais, LingPipe


