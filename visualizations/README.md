## Visual Analysis of Simulation Results ##

#Premises#

We want to compare two *runs* of a topic modeller, or (equivalently), the *state* of a topic model before and after a particular *action* or *adjustment*. We have done so *numerically* and *holistically* in a different part of the process. But here we want to do so in the context of a one or more static view of a *visualization*. We assume:

1. These views are **unsupervised**: we do not have access to ground truth data, just what the topic modeller spits out.
2. These views are **independent**: the prior state of the model is not being used as input for the view. (nor has animation or any other sort of transition been used to display the model)
3. The view are **limited**: the user will only be able to take in a subset of the information of the model at a time. For instance, they will not visualize the full contents of each document simultaneously.
4. The views are **comparable**: we can calculate the difference between two views in a meaningful (ideally metric) way.

#We instantiate these assumptions by:#
1. Including only the prediction data provided by a single run of topic model in a visualization. So that's the document probability for each topic, and the token probability for each topic. (I might potentially bring in other *a priori* corpus information, like tf.idf values or document raw texts).
2. Mostly covered by the above. But the idea here is that we have a bunch of independent views. The user selects two *runs* and then selects some parameters.
3. Not including every single token, topic, or text in a view simultaneously, except in the aggregate. E.g., if we are looking at the top tokens in a topic, I might only visualize the top *w* of those tokens. I might only list by name the top *d* documents in a topic. Or the top *t* topics in a corpus.
4. Computing a variety of the *Jaccard index* between two views. How many texts, tokens, or topics are in common across two particular views? We use this as a **proxy metric** for visual difference. That is, if the Jaccard index is close to 1, then the views are similar from the user's perspective. If it is close to 0, then the views are very different. A viewer might become "lost" if, after a minor change, the view changes completely. For views with important quantitative data, then I will also compute the *L_1 norm* between the views (only for the subset of items that are in the intersection of both views). Ideally I want these metrics to be connected to our prior analyses, rather than do something de novo.

#View Types:#
1. **Topics by text count**. Histogram of how many documents are in each topic, functioning as a corpus overview. Will probably be *unlabeled* (as in TopicCheck), so we can fit all of the topics in there (maybe cap it at *t=100* topics). I was thinking of this as a summarizing component of the view below. A more "traditional" corpus overview might be a spatialization (laying out through t-sne, say), but that a) seems like a lot of work for not much reward b) doesn't line up with our other analyses and c) the question of what makes e.g. one scatterplot "different" from another is an open research question, especially in this case where we'd expect some significant overplotting and complexity.
2. **Matrix view of texts by topic**. For a subset of topics we might want a *list* of top documents in particular topics. Right now this is a just a list of lists (I could make this a radial layout or something, but none of our metrics care about that particular layout choice). This *could* be a matrix like below, but defining "most important texts" across the whole corpus (in the same way we could define top tokens) seems iffy.
3. **Matrix view of tokens by topic**. Here I'm specifically thinking of a termite-style matrix of top terms (defined at the *corpus* level, through tf-idf or other standard metrics), and their relevance across a subset of topics.
