# Entity reconciliation

Entity reconciliation can be used to check if any entry in a data column
makes mention of persons or companies of interest. More generally, the
function enables another application - typically [Open Refine](http://openrefine.org) -
to link up (*reconcile*) values in it's own data with the entities stored
in this service.

To use the reconciliation function, first install the free Open Refine tool
on your computer and create a new project from a spreadsheet with at least
one column that contains the names of people or companies. In the header of
that column, select the drop down menu, *Reconcile*, then 
*Start reconciling...*. The following window allows you to add a new standard
reconciliation service. Paste the URL for Aleph and click *Add Service*. Then
choose *Start reconciling* to begin the reconciliation process.

For further information, consult the following documents:

* [Data Augmentation in Refine](https://www.youtube.com/watch?v=5tsyz3ibYzk#t=2m42) (YouTube video).
* [Reconciliation](https://github.com/OpenRefine/OpenRefine/wiki/Reconciliation) in the Open Refine wiki.
