if(NOT TARGET fbjni::fbjni)
add_library(fbjni::fbjni SHARED IMPORTED)
set_target_properties(fbjni::fbjni PROPERTIES
    IMPORTED_LOCATION "/Users/ElRouby/.gradle/caches/8.10.2/transforms/d51b0c1ef5a2adce1aea4bc70aa4d41d/transformed/jetified-fbjni-0.7.0/prefab/modules/fbjni/libs/android.x86_64/libfbjni.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/ElRouby/.gradle/caches/8.10.2/transforms/d51b0c1ef5a2adce1aea4bc70aa4d41d/transformed/jetified-fbjni-0.7.0/prefab/modules/fbjni/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

