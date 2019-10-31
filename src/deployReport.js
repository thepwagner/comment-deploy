const fs = require('fs');
const github = require('@actions/github');
const core = require('@actions/core');

async function run() {
  const environment = core.getInput('ENVIRONMENT');
  const deploymentID = core.getInput('DEPLOYMENT_ID');
  if (!environment || !deploymentID) {
    return;
  }

  const state = core.getInput('DEPLOYMENT_STATUS') || 'error';
  const logPath = core.getInput('DEPLOYMENT_LOG_PATH');

  const token = core.getInput('TOKEN');
  const octokit = new github.GitHub(token);
  const eventIssue = github.context.issue;
  const { owner, repo } = eventIssue;

  // Post log file back as comment, since there isn't much room in deployment.description:
  if (logPath) {
    const output = fs.readFileSync(logPath);

    let header;
    if (state === 'success') {
      header = `:white_check_mark: Deployment ${environment} - SUCCESS`
    } else {
      header = `:boom: Deployment ${environment} - FAILURE`
    }

    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: eventIssue.number,
      body: header + '\n```\n' + output + '\n```\n',
    });
  }

  await octokit.repos.createDeploymentStatus({
    owner,
    repo,
    deployment_id: deploymentID,
    state,
  });
};

run();