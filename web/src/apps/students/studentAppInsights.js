/**
 * Read Jobs / Bank / Behavior snapshots for a student profile (localStorage).
 * Apps own the live stores; this is a cross-app insight surface only.
 */

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function studentInClass(student, cls) {
  if (!cls?.studentList?.length || !student) return false;
  const id = String(student.id);
  if (Array.isArray(student.classIds) && student.classIds.map(String).includes(String(cls.id))) {
    return true;
  }
  return cls.studentList.some(
    (s) =>
      String(s.id) === id ||
      s.name?.toLowerCase() === student.name?.toLowerCase(),
  );
}

function formatMoney(n) {
  const v = Number(n) || 0;
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

/**
 * @param {object} student
 * @param {object[]} classes - active class list from ClassContext
 */
export function getStudentCrossAppInsights(student, classes = []) {
  if (!student?.id) {
    return { bank: null, behavior: null, jobs: null, hasAny: false };
  }

  const id = String(student.id);
  const bankByClass = readJson('eduHub.bank.accountsByClass');
  const jobsByClass = readJson('eduHub.jobs.dataByClass');
  const pointsByClass = readJson('eduHub.behavior.pointsByClass');

  const memberships = (classes || []).filter(
    (c) => !c.isArchived && studentInClass(student, c),
  );

  let balance = 0;
  let bankFound = false;
  let bankJob = null;
  let bankSalary = 0;
  let bankClassLabel = null;
  const recentTx = [];

  let points = 0;
  let pointsFound = false;
  let pointsClassLabel = null;

  let jobTitle = null;
  let jobSalary = 0;
  let jobClassLabel = null;

  for (const cls of memberships) {
    const cid = String(cls.id);
    const account = bankByClass[cid]?.[id];
    if (account) {
      bankFound = true;
      balance += Number(account.balance) || 0;
      if (account.job && account.job !== 'Unassigned') {
        bankJob = account.job;
        bankSalary = Number(account.salary) || 0;
        bankClassLabel = cls.name;
      }
      for (const tx of (account.transactions || []).slice(0, 4)) {
        recentTx.push({
          ...tx,
          className: cls.name,
        });
      }
    }

    if (pointsByClass[cid] && Object.prototype.hasOwnProperty.call(pointsByClass[cid], id)) {
      pointsFound = true;
      points += Number(pointsByClass[cid][id]) || 0;
      pointsClassLabel = cls.name;
    }

    const assignment = jobsByClass[cid]?.assignments?.[id];
    if (assignment?.job && assignment.job !== 'Unassigned') {
      jobTitle = assignment.job;
      jobSalary = Number(assignment.salary) || 0;
      jobClassLabel = cls.name;
    }
  }

  // Prefer Jobs app assignment; fall back to Bank-synced job fields.
  if (!jobTitle && bankJob) {
    jobTitle = bankJob;
    jobSalary = bankSalary;
    jobClassLabel = bankClassLabel;
  }

  recentTx.sort((a, b) => String(b.id).localeCompare(String(a.id)));

  const bank = bankFound
    ? {
        balance,
        balanceLabel: formatMoney(balance),
        job: bankJob,
        salaryLabel: bankJob ? formatMoney(bankSalary) : null,
        classLabel: bankClassLabel,
        recent: recentTx.slice(0, 3),
      }
    : null;

  const behavior = pointsFound
    ? {
        points,
        pointsLabel: points > 0 ? `+${points}` : String(points),
        classLabel: pointsClassLabel,
      }
    : null;

  const jobs = jobTitle
    ? {
        job: jobTitle,
        salaryLabel: formatMoney(jobSalary),
        classLabel: jobClassLabel,
      }
    : null;

  return {
    bank,
    behavior,
    jobs,
    membershipCount: memberships.length,
    hasAny: Boolean(bank || behavior || jobs),
  };
}
