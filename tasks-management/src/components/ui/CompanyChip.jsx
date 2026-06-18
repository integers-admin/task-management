import { companyKey } from '../../utils/helpers'

export default function CompanyChip({ company }) {
  return (
    <span className={`co-chip co-chip-${companyKey(company)}`}>{company}</span>
  )
}
