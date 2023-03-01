//@ts-nocheck
import * as core from '@actions/core'
import * as github from '@actions/github'
import fetch from 'node-fetch'

async function run(): Promise<void> {
  try {
    core.debug('Hello from main.ts');
    const usernames: string = core.getInput('usernames')
    const group = usernames.split(',')
    const count = Number(core.getInput('count'))
    const [owner, repo] = process.env.GITHUB_REPOSITORY!.split('/')
    const pull_number = github.context.issue.number

    var requestOptions = {
      method: 'GET',
      headers: {
        Authorization: process.env['GITHUB_TOKEN'] as string,
        Accept: 'application/json'
      },
      redirect: 'follow'
    }
    core.info(`Triggered for: ${owner,repo,pull_number}`);
    fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/reviews?per_page=100`,
      requestOptions as any
    )
      .then(response => {
        core.info(`API response: ${response}`);
        return response.json()
      })
      .then(res => {
        core.info(`Reviewers response: ${res}`);
        const reviews = res
          .map((d: {user: {login: any}; state: any}) => {
            const login = d?.user?.login
            const state = d?.state

            if (login && group.includes(login) && state === 'APPROVED') {
              return login
            }
            return
          })
          .filter(Boolean)
          core.info(`Reviews: ${reviews}`);
        if (reviews.length < count)
          core.setFailed(`Mandatory Approval Required from ${usernames}`)
      })
      .catch(error => {
        core.info(`Catch error 1: ${error}`);
        core.setFailed(error.message)
      })
  } catch (error) {
    core.info(`Catch error 2: ${error}`);
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
