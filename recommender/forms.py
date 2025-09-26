from django import forms

class JobSearchForm(forms.Form):
    job_description = forms.CharField(widget=forms.Textarea(attrs={'rows': 4}))
    top_n = forms.IntegerField(
        label="Number of Recommendations",
        min_value=1,
        max_value=20,
        initial=5,
        required=False
    )