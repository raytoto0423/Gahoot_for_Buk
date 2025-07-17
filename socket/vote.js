// vote.js
let votes = [0, 0];
let voted_acc = [];
let all_accounts = {};

function vote(vote_number = -1, acc) {
    if (vote_number === 1) votes[0]++;
    else if (vote_number === 2) votes[1]++;
    else throw new Error('invalid vote number: ' + vote_number);

    if (!voted_acc.includes(acc)) voted_acc.push(acc);
}

function acc_exist(acc) {
    return voted_acc.includes(acc);
}

function get_vote() {
    return [votes, voted_acc.length];
}

function reset_vote() {
    votes = [0, 0];
    voted_acc = [];
}

function register_user(acc) {
    all_accounts[acc] = true;
}

function get_total_user_count() {
    return Object.keys(all_accounts).length;
}

module.exports = {
    vote,
    get_vote,
    reset_vote,
    acc_exist,
    register_user,
    get_total_user_count
};
