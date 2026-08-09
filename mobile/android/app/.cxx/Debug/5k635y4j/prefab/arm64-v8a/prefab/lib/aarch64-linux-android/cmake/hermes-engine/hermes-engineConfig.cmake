if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "/Users/ElRouby/.gradle/caches/8.10.2/transforms/fdd113e2e95f59402f7a3d969640ecce/transformed/hermes-android-0.79.4-debug/prefab/modules/libhermes/libs/android.arm64-v8a/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/ElRouby/.gradle/caches/8.10.2/transforms/fdd113e2e95f59402f7a3d969640ecce/transformed/hermes-android-0.79.4-debug/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

