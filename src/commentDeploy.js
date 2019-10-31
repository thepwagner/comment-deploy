const github = require('@actions/github');
const core = require('@actions/core');

if (typeof core.setNeutral === 'undefined') {
  core.setNeutral = console.log;
}

async function run() {
  const { payload } = github.context;
  // Ignore events without a PR (e.g. from issues):
  if (!payload.issue.pull_request) {
    core.setNeutral('not a pull request, skipping');
    return;
  }

  // Match `.deploy`, with optional environment+args:
  const bodyMatch = payload.comment.body.match(/^\.deploy( [a-z]*)?( .*)?/);
  if (!bodyMatch) {
    core.setNeutral('not a deployment comment request comment, skipping');
    return;
  }

  const token = core.getInput('TOKEN');
  const octokit = new github.GitHub(token);
  const eventIssue = github.context.issue;
  const { owner, repo } = eventIssue;

  // Verify requested environment:
  const environments = core.getInput('environments').split(',');
  const environment = (bodyMatch[1] || environments[0]).trim();
  if (!environments.includes(environment)) {
    let body = ':boom: Environment `' + environment + '` unknown';
    if (environments.length > 0) {
      body += '\n' + environments.map((s) => '* `' +s + '`').join('\n') + '\n';
    }
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: eventIssue.number,
      body,
    });
    core.setFailed(`environment ${environment} unknown`);
    return;
  }

  // Create a deployment using the PR's ref:
  const pr = await octokit.pulls.get({
    owner,
    repo,
    pull_number: eventIssue.number,
  });
  const deployArgs = (bodyMatch[2] || '').trim();
  const { ref }  = pr.data.head;
  const createdDeployment = await octokit.repos.createDeployment({
    owner,
    repo,
    ref,
    auto_merge: true,
    payload: {
      args: deployArgs,
    },
    environment,
  });
  if (!createdDeployment.data || !createdDeployment.data.id) {
    // No deployment created but no error; likely auto-merge.
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: eventIssue.number,
      body: `Please retry deployment after CI`,
    });
    core.setNeutral('merged master');
    return;
  }

  core.setOutput('ENVIRONMENT', environment);
  core.setOutput('DEPLOY_REF', ref);
  core.setOutput('DEPLOY_ARGUMENTS', deployArgs);
  core.setOutput('DEPLOYMENT_ID', createdDeployment.data.id);
};

run();