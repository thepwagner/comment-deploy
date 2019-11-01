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

If you use GitHub Actions for deployment, you can do that as part of the workflow:
```
name: CommentOps
on: [issue_comment]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v1
    # Filter comments that trigger a deploy:
    - uses: docker://thepwagner/comment-deploy:latest
      id: comment
      with:
        entrypoint: comment-deploy
        TOKEN: ${{ secrets.GITHUB_TOKEN }}
        ENVIRONMENTS: staging,production

    # Deployment step:
    - name: Deployment
      id: deployment
      env:
        ENVIRONMENT: ${{ steps.comment.outputs.ENVIRONMENT }}
        DEPLOY_REF: ${{ steps.comment.outputs.DEPLOY_REF }}
      run: |
        # Exit if there's no environment; a "neutral/78" exit above would be handy
        [ -z "${ENVIRONMENT}" ] && exit 0

        set -e
        git checkout "$DEPLOY_REF"
        echo ::set-output name=DEPLOYMENT_LOG_PATH,::log.txt
        (sh | tee log.txt) <<EOF
           # your deployment logic here
        EOF
        echo ::set-output name=DEPLOYMENT_STATUS,::success

    # If deploy succeeds/fails, always report status:
    - uses: docker://thepwagner/comment-deploy:latest
      if: always()
      with:
        entrypoint: deploy-report
        TOKEN: ${{ secrets.GITHUB_TOKEN }}
        DEPLOYMENT_ID: ${{ steps.comment.outputs.DEPLOYMENT_ID }}
        ENVIRONMENT: ${{ steps.comment.outputs.ENVIRONMENT }}
        DEPLOYMENT_STATUS: ${{ steps.deployment.outputs.DEPLOYMENT_STATUS }}
        DEPLOYMENT_LOG_PATH: ${{ steps.deployment.outputs.DEPLOYMENT_LOG_PATH }}
```
