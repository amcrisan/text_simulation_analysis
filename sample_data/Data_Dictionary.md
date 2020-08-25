## Data Dictionary of the Analysis Files


* Runs - *Table of each run, with overall performance metrics*
    * run_id: *unique run identifier*
    * action_type : *what the theoretical user action was
    * action_impact : *where in the pipeline did the action trigger a re-running*
    * action_details : *A string of what exactly took place*
    * action_details_short: *Md5sum of the action details string (makes life easier for filtering).
    * metric : A categorical variable with the metrics that are stored
    * metric_score : The value for the metric
    

* Topics Terms - *Table of all the topics and their top 100 words*
    * topic_id *unique identifier for each topic*
    * run_id: *unique identifier for each run*
    * top_term_order: *a number from 1 to 10 indicating the ordering of top words (based upon posterior probability)*
    * top_term: *a string with the top term*
    * top_term_prob : *a posterior probabillty of the term beloning to the a topic*
    

* Topic Docs - *Table of all the topics and their top 100 documents*
    * topic_id *unique identifier for each topic*
    * run_id: *unique identifier for each run*
    * top_doc_order : *a number from 1 to 10 0indicating the ordering of top documents (based upon cluster assignment probability)*
    * top_doc_prob: *a string with the top term*
    * top_doc: *a string with the id to the documents, will match to document ID in documents*

* Ground truth - *A table of ground truth classes*
    * gt_id: *Unique identifier for ground truth class*
    * run_id : *Unique identifier for each run, links to the run table*
    * category : *the name of the class*
    * accuracy : *A metric of ground truth class accuracy*
    * grp_size : *The size of the each ground truth class*
    

* Documents - *Table of all documents and the topics they are assigned to*
    * doc_id: *Unique identifier for each document*
    * run_id : *Unique identifier for each run, links to run table*
    * gt_topic: *Unique identifier for the ground truth class, links to ground truth table*
    * topic_id: *Unique identifier for each topic, links to topics table*
    * topic_prob : *Probability between zero and one of a document being assinged to a topic*
    * topic_assigned : *Binary variable indicating whether the Topic ID is the one assigned to the document (i.e. max probability)*
    * silhouette : *the shiloutte score for the document*

The documents file is current to large to sync to github.
    


    