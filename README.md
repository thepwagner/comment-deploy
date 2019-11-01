# comment-deploy

GitHub Action for deploying PRs via comment.

[Example](https://github.com/thepwagner/comment-deploy/pull/1#issuecomment-548614735)

If you use another app that listens to the GitHub deployments API:

```
name: CommentOps
on: [issue_comment]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: docker://thepwagner/comment-deploy:latest
      with:
        TOKEN: ${{ secrets.GITHUB_TOKEN }}
        ENVIRONMENTS: beta,latest
```

This will create a deployment when a user comments `.deploy ENVIRONMENT`.
