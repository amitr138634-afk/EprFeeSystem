import SimpleLabelMaster from './SimpleLabelMaster'
import { masterApi } from '../../services/api'

export default function CategoryMaster() {
  return (
    <SimpleLabelMaster
      title="Category Master"
      subtitle="Admission/reservation categories (General, OBC, SC, ST, EWS, etc.)"
      fieldName="category_name"
      fieldLabel="Category Name"
      placeholder="e.g., General, OBC, SC, ST, EWS"
      queryKey="category-master"
      addLabel="Add Category"
      itemLabel="Category"
      api={{
        get: masterApi.getCategoryMaster,
        create: masterApi.createCategoryMaster,
        update: masterApi.updateCategoryMaster,
        remove: masterApi.deleteCategoryMaster,
        toggle: masterApi.toggleCategoryMasterStatus,
      }}
    />
  )
}
