import { Input } from '@/components/ui/input.tsx'
import type { FC } from 'react'

let _searchDebounce: number | null = null

type Props = {
  setSearchValue: (searchValue: string) => void
}
const SearchInput: FC<Props> = ({ setSearchValue }) => {
  return (
    <Input
      type="search"
      placeholder="Search..."
      className="w-full md:w-32 border-2 h-[38px]"
      style={{ borderColor: '#45556C' }}
      onChange={(e) => {
        if (_searchDebounce) {
          window.clearTimeout(_searchDebounce)
        }
        _searchDebounce = window.setTimeout(() => {
          setSearchValue(e.target.value)
        }, 500)
      }}
    />
  )
}

export default SearchInput
