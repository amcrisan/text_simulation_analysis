# Visual Analysis of Simulation Results

This folder contains code for comparing how two runs of our pipeline might look as visualized via a set of representative visualizations, implemented in D3.

To use, spin up a server via your favorite method. i.e.,

```
python -m http.server 8000
```

## Premises

We want to compare two *runs* of a topic modeller, or (equivalently), the *state* of a topic model before and after a particular *action* or *adjustment*. We have done so *numerically* and *holistically* in a different part of the process. But here we want to do so in the context of a one or more static view of a *visualization*. We assume:

1. These views are **unsupervised**: we do not have access to ground truth data, just what the topic modeller spits out.
2. These views are **independent**: the prior state of the model is not being used as input for the view. (nor has animation or any other sort of transition been used to display the model)
3. The view are **limited**: the user will only be able to take in a subset of the information of the model at a time. For instance, they will not visualize the full contents of each document simultaneously.
4. The views are **comparable**: we can calculate the difference between two views in a meaningful (ideally metric) way.

## We instantiate these assumptions by:
1. Including only the prediction data provided by a single run of topic model in a visualization. So that's the document probability for each topic, and the token probability for each topic.
2. Mostly covered by the above. But the idea here is that we have a bunch of independent views. The user selects two *runs* and then selects some parameters.
3. Not including every single token, topic, or text in a view simultaneously, except in the aggregate. E.g., if we are looking at the top tokens in a topic, I might only visualize the top *w* of those tokens. I might only list by name the top *d* documents in a topic. Or the top *t* topics in a corpus.
4. Including our metric information along with each topic run.

## View Types:
1. **Topics by number of texts**. In keeping with the textviz field's preference for radial information, this is presented as a pie chart in additon to a more standard histogram. Only the top *n* topics get their own color, which is preserved across the other views; the rest are just an identical shade of black.
2. **Matrix view of tokens by topic**. Here I'm specifically thinking of a termite-style matrix of top terms (defined at the *corpus* level, in this case just by how the most popular terms across topic lists), and their score across a subset of topics.
3. **Table views of tokens and texts by topic**. The texts with the highest scores for each of the top topics, in descending order. Followed by the tokens with the highest scores.

## Data needed:
1. **runs_sample** (called *run-data.csv* in the current code): what runs are in this data, and what did we do each run?
2. **pred_topics_docs_sample.csv** (called *topics-by-texts.csv* in the current code): what are the top docs for each topic, for each run?
3. **pred_topics_terms_sample.csv** (called *words-by-topics.csv*): what are the top words for each topic, for each run?
4. **pivoted table of text counts by topic** (called *topics-by-count.csv*): how many documents are in each topic, for each run? Has three columns, *run_id*, *topic_id*, and *count*. I just made this via a pivot in R, but you do you.
