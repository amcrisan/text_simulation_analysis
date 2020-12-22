## Analysis of Simulation Results

This repository contains our data generation pipeline and our analysis notebooks that examine the results of simulation data for an LDA based text analytics pipeline as part of a paper _User Ex Machina: Simulation as a Design Probe in Human-in-the-Loop Text Analytics_. Link to the author's copy of the submission available soon.

The general purpose of this project is to provide a pipeline simulating user actions on an abstract topic modeling system, and then comparing the impact of these actions across many different runs of the topic model, with an idea to understand how particular kinds of user actions impact the resulting models, either in terms of performance or in visual difference.

This repository includes:
1. An [R markdown file](Overall_Analysis.Rmd) that is the basis of our analysis in the paper, generated by running our data on the Reuters-21578 dataset. Running this file will generate our output data as csvs. We also include a [similar file](Overall_Analysis_COVID_19.Rmd) for our analysis of a second dataset of COVID-19 related paper abstracts.
2. A [Data_Dictionary](sample_data/Data_Dictionary.md) for interpreting the generated csvs.
3. [Javascript code](visualization/) for generating comparative visualizations of individual runs of our topic model in D3.


Note that this repository does *not* include the full dataset used in our analysis, but only a sample. This is for reasons of space. However, by running our pipeline you will be able to regenerate our data. You can also download our full data from the [OSF Project](https://osf.io/zgqaw) linked to this repository.
