/**
 * Translation strings for NEUN
 * Organized by feature/page for easier maintenance
 */

export type Locale = 'en'

export const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Navigation
    'nav.jobs': 'Jobs',
    'nav.careers': 'Careers',
    'nav.companies': 'Companies',
    'nav.investors': 'Investors',
    'nav.community': 'Community',
    'nav.post': 'Post a Job',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.admin': 'Admin',
    'nav.bookmarks': 'Bookmarks',

    // Hero / Home
    'hero.title': 'Web3 Jobs from Top VCs',
    'hero.subtitle': 'a16z, Hashed, Paradigm backed companies. Only legit jobs.',
    'hero.cta': 'Browse Jobs',
    'hero.postJob': 'Post a Job',
    'hero.stats.jobs': 'Active Jobs',
    'hero.stats.companies': 'Companies',
    'hero.stats.posted': 'Posted Today',

    // Search
    'search.placeholder': 'Search jobs, companies, or skills...',
    'search.noResults': 'No results found',
    'search.tryAgain': 'Try different keywords',
    'search.recentSearches': 'Recent Searches',
    'search.popularSearches': 'Popular Searches',

    // Filters
    'filter.all': 'All',
    'filter.remote': 'Remote',
    'filter.hybrid': 'Hybrid',
    'filter.onsite': 'Onsite',
    'filter.korea': 'Korea',
    'filter.global': 'Global',
    'filter.fullTime': 'Full-time',
    'filter.partTime': 'Part-time',
    'filter.contract': 'Contract',
    'filter.internship': 'Internship',
    'filter.clearAll': 'Clear All',
    'filter.showMore': 'Show More',
    'filter.showLess': 'Show Less',

    // Job Card / Details
    'job.apply': 'Apply Now',
    'job.applyExternal': 'Apply on Company Site',
    'job.posted': 'Posted',
    'job.ago': 'ago',
    'job.today': 'today',
    'job.yesterday': 'yesterday',
    'job.daysAgo': 'days ago',
    'job.weeksAgo': 'weeks ago',
    'job.monthsAgo': 'months ago',
    'job.salary': 'Salary',
    'job.location': 'Location',
    'job.type': 'Type',
    'job.experience': 'Experience',
    'job.skills': 'Skills',
    'job.description': 'Description',
    'job.requirements': 'Requirements',
    'job.responsibilities': 'Responsibilities',
    'job.benefits': 'Benefits',
    'job.aboutCompany': 'About the Company',
    'job.similarJobs': 'Similar Jobs',
    'job.share': 'Share',
    'job.bookmark': 'Bookmark',
    'job.bookmarked': 'Bookmarked',
    'job.report': 'Report',
    'job.featured': 'Featured',
    'job.new': 'New',
    'job.hot': 'Hot',
    'job.urgent': 'Urgent',
    'job.remote': 'Remote',
    'job.visa': 'Visa Sponsored',

    // Job Levels
    'level.junior': 'Junior',
    'level.mid': 'Mid-level',
    'level.senior': 'Senior',
    'level.lead': 'Lead',
    'level.manager': 'Manager',
    'level.director': 'Director',
    'level.executive': 'Executive',

    // Company
    'company.jobs': 'Open Positions',
    'company.about': 'About',
    'company.size': 'Company Size',
    'company.founded': 'Founded',
    'company.headquarters': 'Headquarters',
    'company.website': 'Website',
    'company.backers': 'Backed by',
    'company.sector': 'Sector',
    'company.stage': 'Stage',
    'company.noJobs': 'No open positions at the moment',

    // Post Job Form
    'postJob.title': 'Post a Job',
    'postJob.subtitle': 'Reach top Web3 talent',
    'postJob.companyName': 'Company Name',
    'postJob.companyWebsite': 'Company Website',
    'postJob.companyLogo': 'Company Logo',
    'postJob.jobTitle': 'Job Title',
    'postJob.jobType': 'Job Type',
    'postJob.location': 'Location',
    'postJob.remote': 'Remote Options',
    'postJob.salary': 'Salary Range',
    'postJob.description': 'Job Description',
    'postJob.requirements': 'Requirements',
    'postJob.techStack': 'Tech Stack',
    'postJob.applyUrl': 'Application URL',
    'postJob.contactEmail': 'Contact Email',
    'postJob.submit': 'Post Job',
    'postJob.submitting': 'Posting...',
    'postJob.success': 'Job posted successfully!',
    'postJob.error': 'Failed to post job',
    'postJob.connectWallet': 'Connect wallet to post',
    'postJob.preview': 'Preview',

    // Wallet / Auth
    'wallet.connect': 'Connect Wallet',
    'wallet.connecting': 'Connecting...',
    'wallet.disconnect': 'Disconnect',
    'wallet.connected': 'Connected',
    'wallet.switchNetwork': 'Switch Network',
    'wallet.wrongNetwork': 'Wrong Network',
    'wallet.copyAddress': 'Copy Address',
    'wallet.copied': 'Copied!',
    'wallet.viewExplorer': 'View on Explorer',

    // Trust / Community
    'trust.score': 'Trust Score',
    'trust.vouch': 'Vouch',
    'trust.vouched': 'Vouched',
    'trust.report': 'Report',
    'trust.reported': 'Reported',
    'trust.vote': 'Vote',
    'trust.voted': 'Voted',
    'trust.guilty': 'Guilty',
    'trust.notGuilty': 'Not Guilty',
    'trust.abstain': 'Abstain',

    // Errors / Status
    'error.general': 'Something went wrong',
    'error.notFound': 'Not Found',
    'error.unauthorized': 'Unauthorized',
    'error.forbidden': 'Access Denied',
    'error.rateLimit': 'Too many requests. Please try again later.',
    'error.network': 'Network error. Please check your connection.',
    'error.tryAgain': 'Try Again',
    'error.goHome': 'Go Home',

    // Loading
    'loading.default': 'Loading...',
    'loading.jobs': 'Loading jobs...',
    'loading.pleaseWait': 'Please wait...',

    // Empty States
    'empty.noJobs': 'No jobs found',
    'empty.noBookmarks': 'No bookmarks yet',
    'empty.noResults': 'No results match your filters',
    'empty.beFirst': 'Be the first to post!',

    // Footer
    'footer.rights': 'All rights reserved',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    'footer.contact': 'Contact Us',
    'footer.about': 'About NEUN',
    'footer.faq': 'FAQ',
    'footer.blog': 'Blog',

    // Time
    'time.justNow': 'Just now',
    'time.minutesAgo': '{n} minutes ago',
    'time.hoursAgo': '{n} hours ago',
    'time.daysAgo': '{n} days ago',
    'time.weeksAgo': '{n} weeks ago',
    'time.monthsAgo': '{n} months ago',

    // Actions
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.delete': 'Delete',
    'action.edit': 'Edit',
    'action.submit': 'Submit',
    'action.confirm': 'Confirm',
    'action.close': 'Close',
    'action.back': 'Back',
    'action.next': 'Next',
    'action.viewAll': 'View All',
    'action.loadMore': 'Load More',
    'action.refresh': 'Refresh',
  },
}
